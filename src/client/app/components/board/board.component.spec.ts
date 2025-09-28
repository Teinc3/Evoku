import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import UtilityAction from '../../../types/utility';
import BoardModelComponent from './board.component';


// Simple static puzzle for seeding tests
const puzzle: number[] = Array.from({ length: 81 }, (_, i) => (i % 9 === 0 ? (i / 9) + 1 : 0));

describe('BoardModelComponent', () => {
  let fixture: ComponentFixture<BoardModelComponent>;
  let component: BoardModelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardModelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders 81 cells', () => {
    const cells = fixture.debugElement.queryAll(By.css('app-cell-model'));
    expect(cells.length).toBe(81);
  });

  it('emits selection and applies selected class', () => {
    component.onCellSelected(0);
    fixture.detectChanges();
    const first = fixture.debugElement.queryAll(By.css('app-cell-model'))[0].nativeElement;
    expect(component.selected()).toBe(0);
    expect(first.classList.contains('selected')).toBeTrue();
  });

  it('supports puzzle seeding via loadPuzzle()', () => {
    component.loadPuzzle(puzzle);
    fixture.detectChanges();
    expect(component.getCellModel(0).fixed).toBeTrue();
    expect(component.getCellModel(0).value).toBe(1);
  });

  it('initializes empty board when no puzzle provided', () => {
    // Component already initialized in beforeEach
    expect(component.model.board.length).toBe(81);
    expect(component.getCellModel(0).value).toBe(0);
    expect(component.getCellModel(0).fixed).toBeFalse();
  });

  it('getCellModel defensively initializes missing entries', () => {
    // Simulate missing entry
    delete component.model.board[10];
    const m = component.getCellModel(10);
    expect(m).toBeDefined();
    expect(m.value).toBe(0);
  });

  it('toggles note mode when NOTE action invoked', () => {
    expect(component.isNoteMode).toBeFalse();
    component.onUtilityAction(UtilityAction.NOTE);
    expect(component.isNoteMode).toBeTrue();
    component.onUtilityAction(UtilityAction.NOTE);
    expect(component.isNoteMode).toBeFalse();
  });

  it('clears selected cell when CLEAR action invoked (pending value path)', () => {
    component.initBoard([]);
    component.onCellSelected(0);
    const time = performance.now();
    component.setPendingSelected(5, time);
    // Simulate server confirming value so that CLEAR meaningfully changes it back to 0
    component.model.confirmCellSet(0, 5, time);
    expect(component.getCellModel(0).value).toBe(5);
    const spy = spyOn(component.model, 'setPendingCell').and.callThrough();
    component.onUtilityAction(UtilityAction.CLEAR); // parseNumberKey(0) -> setPendingSelected(0)
    expect(spy).toHaveBeenCalledWith(0, 0, jasmine.any(Number));
  });
});

