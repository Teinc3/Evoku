import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';

import SudokuCellComponent from '../cell/cell.component';
import BoardModelComponent from './board.component';

import type { ComponentFixture } from '@angular/core/testing';


// Minimal mock puzzle generator
const puzzle = Array.from({ length: 81 }, (_, i) => (i % 9 === 0 ? (i / 9) + 1 : 0));

describe('BoardModelComponent', () => {
  let fixture: ComponentFixture<BoardModelComponent>;
  let component: BoardModelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardModelComponent, SudokuCellComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BoardModelComponent);
    component = fixture.componentInstance;
  });

  it('renders 81 cells', () => {
    fixture.detectChanges();
    const cells = fixture.debugElement.queryAll(By.css('app-sudoku-cell'));
    expect(cells.length).toBe(81);
  });

  it('emits selection and updates child selected state', () => {
    fixture.detectChanges();
    const cells = fixture.debugElement.queryAll(By.css('app-sudoku-cell'));
    // simulate selecting the 0th cell via component API
    component.onCellSelected(0);
    fixture.detectChanges();

    // Check board selected signal is set
    expect(component.selected()).toBe(0);
    // The first child should have selected class via parent binding
    expect(cells[0].nativeElement.classList.contains('selected')).toBeTrue();
  });

  it('supports seeding puzzle and marks fixed cells', () => {
    component.puzzle = puzzle;
    fixture.detectChanges();

    // After seed, model should have fixed cells for non-zero entries
    expect(component.model.board[0].fixed).toBeTrue();
  });

  it('seeds empty board on init when no puzzle provided', () => {
    // fresh instance to avoid previous test side effects
    fixture = TestBed.createComponent(BoardModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Board should be initialized with 81 empty non-fixed cells
    expect(component.model.board.length).toBe(81);
    expect(component.model.board[0]).toBeDefined();
    expect(component.model.board[0].value).toBe(0);
    expect(component.model.board[0].fixed).toBeFalse();
  });

  it('puzzle setter after init re-seeds the board', () => {
    fixture.detectChanges(); // triggers empty init
    // Ensure an initially empty cell is not fixed
    expect(component.model.board[0].fixed).toBeFalse();

    // Now set the puzzle via the setter and verify seeding occurs
    component.puzzle = puzzle;
    fixture.detectChanges();
    expect(component.model.board[0].fixed).toBeTrue();
    // value should match provided puzzle
    expect(component.model.board[0].value).toBe(1);
  });

  it('getCellModel fallback creates a missing cell model defensively', () => {
    fixture.detectChanges();
    // Simulate an unexpected missing entry
     
    delete component.model.board[10];
    const m = component.getCellModel(10);
    expect(m).toBeDefined();
    expect(m.value).toBe(0);
    expect(m.fixed).toBeFalse();
  });

  it('emits selectedIndexChange when a cell is selected', () => {
    const spy = jasmine.createSpy('selectedIndexChange');
    component.selectedIndexChange.subscribe(spy);
    component.onCellSelected(7);
    expect(spy).toHaveBeenCalledWith(7);
    expect(component.selected()).toBe(7);
  });

  it('setPendingSelected returns false when no selection', () => {
    const ok = component.setPendingSelected(5, 123);
    expect(ok).toBeFalse();
  });

  it('setPendingSelected delegates to model when selected', () => {
    fixture.detectChanges();
    component.onCellSelected(5);
    const spy = spyOn(component.model, 'setPendingCell').and.returnValue(true);
    const now = performance.now();
    const ok = component.setPendingSelected(9, now);
    expect(ok).toBeTrue();
    expect(spy).toHaveBeenCalledWith(5, 9, now);
  });

  it('confirmSelected returns false when no selection or no pending', () => {
    expect(component.confirmSelected(performance.now())).toBeFalse();
    // With selection but no pending value
    fixture.detectChanges(); // ensure ngOnInit seeds board before selecting
    component.onCellSelected(3);
    expect(component.confirmSelected(performance.now())).toBeFalse();
  });

  it('confirmSelected delegates when pending exists', () => {
    fixture.detectChanges();
    const idx = 2;
    component.onCellSelected(idx);
    // set minimal pending state
    component.model.board[idx].pendingCellState = { pendingValue: 4 };
    const spy = spyOn(component.model, 'confirmCellSet').and.returnValue(true);
    const t = performance.now();
    const ok = component.confirmSelected(t);
    expect(ok).toBeTrue();
    expect(spy).toHaveBeenCalledWith(idx, 4, t);
  });

  it('rejectSelected delegates when selected and is a no-op otherwise', () => {
    // No selection → should not throw
    component.rejectSelected();

    // With selection → delegates
    fixture.detectChanges();
    component.onCellSelected(8);
    const spy = spyOn(component.model, 'rejectCellSet');
    component.rejectSelected();
    expect(spy).toHaveBeenCalledWith(8);
  });
});
