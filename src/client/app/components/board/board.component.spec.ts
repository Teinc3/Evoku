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

  it('moves selection with keyboard and wraps vertically and horizontally', () => {
    // No selection initially -> pressing ArrowUp selects center (40)
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.selected()).toBe(40);

    // Move up repeatedly to test wrap from top to bottom
    for (let i = 0; i < 5; i++) {
      component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    }
    // We should now be some cells above; force to top row then wrap
    // Jump directly to top-left (0) for deterministic wrap check
    component.onCellSelected(0);
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.selected()).toBe(72); // Wrapped to bottom row same column

    // Horizontal wrap: from col 0 pressing ArrowLeft wraps to col 8
    component.onCellSelected(9); // Row 1, col 0
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(component.selected()).toBe(17); // 9 + 8

    // From rightmost pressing ArrowRight wraps left
    component.onCellSelected(17); // row1 col8
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(component.selected()).toBe(9); // row1 col0
  });

  it('initial ArrowDown selects center cell when nothing selected', () => {
    expect(component.selected()).toBeNull();
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.selected()).toBe(40);
  });

  it('initial ArrowLeft selects center cell when nothing selected', () => {
    expect(component.selected()).toBeNull();
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(component.selected()).toBe(40);
  });

  it('initial ArrowRight selects center cell when nothing selected', () => {
    expect(component.selected()).toBeNull();
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(component.selected()).toBe(40);
  });

  it('number key sets pending and backspace/0 triggers wipeNotes path', () => {
    component.initBoard([]);
    component.onCellSelected(0);
    // Add notes mode then add a note
    component.onUtilityAction(UtilityAction.NOTE);
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: '5' }));
    expect(component.getCellModel(0).notes).toContain(5);
    // Exit note mode so that parseNumberKey(0) will try wipeNotes
    component.onUtilityAction(UtilityAction.NOTE);
    // Add another note (need note mode) then exit again
    component.onUtilityAction(UtilityAction.NOTE);
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: '3' }));
    component.onUtilityAction(UtilityAction.NOTE);
    expect(component.getCellModel(0).notes.length).toBeGreaterThan(0);
    const wipeSpy = spyOn(component.getCellModel(0), 'wipeNotes').and.callThrough();
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: '0' }));
    expect(wipeSpy).toHaveBeenCalled();
    expect(component.getCellModel(0).notes.length).toBe(0);
  });

  it('loadPuzzle early returns on invalid length', () => {
    const initialFirst = component.getCellModel(0).value;
    component.loadPuzzle([] as unknown as number[]); // invalid length 0
    expect(component.getCellModel(0).value).toBe(initialFirst);
  });

  it('ignores number key when no selection', () => {
    // Ensure nothing selected
    expect(component.selected()).toBeNull();
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: '1' }));
    // Still null selection, so no pending set anywhere
    const anyPending
      = component.model.board.some(c => c?.pendingCellState?.pendingValue !== undefined);
    expect(anyPending).toBeFalse();
  });

  it('wraps DOWN and RIGHT movement branches explicitly', () => {
    // DOWN wrap: select bottom row then move DOWN
    component.onCellSelected(72); // bottom-left
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.selected()).toBe(0);

    // RIGHT wrap: select rightmost cell of a row then move RIGHT
    component.onCellSelected(17); // row1 col8
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(component.selected()).toBe(9); // row1 col0
  });

  it('cooldown helper is properly instantiated', () => {
    expect(component.cooldownHelper).toBeDefined();
    expect(component.cooldownHelper.currentAngle).toBeDefined();
    expect(component.cooldownHelper.transitionDuration).toBeDefined();
  });

  it('calls helper destroy on component destroy', () => {
    const destroySpy = spyOn(component.cooldownHelper, 'destroy');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
  });
});

