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
});
