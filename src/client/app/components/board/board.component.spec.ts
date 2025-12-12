import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import UtilityAction from '../../../types/utility';
import ClientBoardModel from '../../../models/Board';
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
    // Initialize component with a board model
    component.model = new ClientBoardModel([]);
    component.isMe = true; // Enable input handling for tests
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
    component.model.initBoard(puzzle);
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

  it('does nothing on keyboard input when cursor is null', () => {
    expect(component.selected()).toBeNull();
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.selected()).toBeNull();
    // Also test number key
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: '1' }));
    expect(component.selected()).toBeNull();
  });

  it('moves selection with keyboard and wraps vertically and horizontally', () => {
    // No selection initially -> pressing ArrowUp does nothing
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(component.selected()).toBeNull();

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

    // Vertical wrap down: from bottom row pressing ArrowDown wraps to top
    component.onCellSelected(72); // Bottom-left
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.selected()).toBe(0); // Wrapped to top row same column
  });

  it('number key sets pending and backspace/0 triggers wipeNotes path', () => {
    component.model.initBoard([]);
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

  it('number key sets pending when not in note mode and num != 0', () => {
    component.model.initBoard([]);
    component.onCellSelected(0);
    // Ensure not in note mode
    expect(component.isNoteMode).toBeFalse();
    // Spy on setPendingCell
    const setPendingSpy = spyOn(component.model, 'setPendingCell').and.callThrough();
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: '5' }));
    expect(setPendingSpy).toHaveBeenCalledWith(0, 5, jasmine.any(Number));
  });

  it('onUtilityAction CLEAR calls parseNumberKey with 0', () => {
    component.onCellSelected(0);
    const parseSpy = spyOn(component, 'parseNumberKey');
    component.onUtilityAction(UtilityAction.CLEAR);
    expect(parseSpy).toHaveBeenCalledWith(0);
  });

  it('parseNumberKey does nothing when not isMe', () => {
    component.isMe = false;
    component.onCellSelected(0);
    spyOn(component.sendPacket, 'emit');
    component.parseNumberKey(5);
    expect(component.sendPacket.emit).not.toHaveBeenCalled();
  });

  it('parseNumberKey does nothing when no cell selected', () => {
    spyOn(component.sendPacket, 'emit');
    component.parseNumberKey(5);
    expect(component.sendPacket.emit).not.toHaveBeenCalled();
  });

  it('handleCellRejection resets cooldowns when rejection succeeds', () => {
    component.model.initBoard([]);
    component.onCellSelected(0);
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: '5' })); // Set pending
    const resetSpy = spyOn(component.cooldownHelper, 'reset');
    const cellResetSpy = spyOn(component.cells.get(0)!.cooldownHelper, 'reset');
    component.handleCellRejection(0, 5);
    expect(resetSpy).toHaveBeenCalled();
    expect(cellResetSpy).toHaveBeenCalled();
  });

  it('handleCellRejection does not reset cooldowns when rejection fails', () => {
    component.model.initBoard([]);
    component.onCellSelected(0);
    component.handleKeyboardEvent(new KeyboardEvent('keydown', { key: '5' })); // Set pending
    const resetSpy = spyOn(component.cooldownHelper, 'reset');
    const cellResetSpy = spyOn(component.cells.get(0)!.cooldownHelper, 'reset');
    component.handleCellRejection(0, 6); // Wrong value
    expect(resetSpy).not.toHaveBeenCalled();
    expect(cellResetSpy).not.toHaveBeenCalled();
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
    const destroySpy = spyOn(component.cooldownHelper, 'reset');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
  });

  describe('Cell Highlighting', () => {
    beforeEach(() => {
      // Load a simple puzzle with some values
      component.model.initBoard(puzzle);
      fixture.detectChanges();
    });

    it('identifies related cells in same row', () => {
      component.onCellSelected(0); // Top-left cell
      
      // Cells in same row (0-8) should be related
      for (let i = 1; i < 9; i++) {
        expect(component.isRelatedCell(i)).toBeTrue();
      }
      
      // Cell in different row, column, and grid should not be related
      expect(component.isRelatedCell(40)).toBeFalse(); // Row 4, Col 4
    });

    it('identifies related cells in same column', () => {
      component.onCellSelected(0); // Top-left cell
      
      // Cells in same column (0, 9, 18, 27...)
      expect(component.isRelatedCell(9)).toBeTrue();
      expect(component.isRelatedCell(18)).toBeTrue();
      expect(component.isRelatedCell(27)).toBeTrue();
      
      // Cell in different column, row, and grid should not be related
      expect(component.isRelatedCell(40)).toBeFalse(); // Row 4, Col 4
    });

    it('identifies related cells in same 3x3 grid', () => {
      component.onCellSelected(0); // Top-left cell (grid 0)
      
      // All cells in top-left 3x3 grid should be related
      expect(component.isRelatedCell(1)).toBeTrue();  // Row 0, Col 1
      expect(component.isRelatedCell(2)).toBeTrue();  // Row 0, Col 2
      expect(component.isRelatedCell(10)).toBeTrue(); // Row 1, Col 1
      expect(component.isRelatedCell(20)).toBeTrue(); // Row 2, Col 2
      
      // Cell in different grid, row, and column should not be related
      expect(component.isRelatedCell(40)).toBeFalse(); // Row 4, Col 4 (grid 4)
    });

    it('returns false for related cell check when no cell selected', () => {
      component.selected.set(null);
      expect(component.isRelatedCell(5)).toBeFalse();
    });

    it('returns false for related cell check on selected cell itself', () => {
      component.onCellSelected(10);
      expect(component.isRelatedCell(10)).toBeFalse();
    });

    it('identifies cells with same number', () => {
      // Cell 0 has value 1, cell 9 has value 2 from our puzzle
      component.onCellSelected(0);
      
      // Find other cells with value 1 (cells 9, 18, 27... have values 2, 3, 4... respectively)
      // Since our puzzle has value (i/9)+1 at every 9th position
      // Cell 0 has 1, so no other cells should match
      let foundSameNumberCells = 0;
      for (let i = 1; i < 81; i++) {
        if (component.getCellModel(i).value === 1) {
          expect(component.isSameNumberCell(i)).toBeTrue();
          foundSameNumberCells++;
        }
      }
      
      // Verify that no other cells have the same number (1) as cell 0
      expect(foundSameNumberCells).toBe(0);
    });

    it('does not highlight same number when value is 0', () => {
      component.onCellSelected(1); // Cell with value 0
      
      // Even though cell 2 also has value 0, it shouldn't be highlighted
      expect(component.isSameNumberCell(2)).toBeFalse();
    });

    it('does not highlight opponent dynamic cells with same number', () => {
      component.isMe = false; // Opponent board
      component.onCellSelected(0); // Selected cell has value 1, fixed
      // Make cell 9 have value 1 but not fixed (dynamic)
      const cell9 = component.getCellModel(9);
      (cell9 as unknown as { fixed: boolean }).fixed = false;
      (cell9 as unknown as { value: number }).value = 1;
      // Since cell 9 is dynamic and has value, should not be highlighted
      expect(component.isSameNumberCell(9)).toBeFalse();
    });

    it('returns false for same number check when no cell selected', () => {
      component.selected.set(null);
      expect(component.isSameNumberCell(5)).toBeFalse();
    });

    it('returns false for same number check on selected cell itself', () => {
      component.onCellSelected(0);
      expect(component.isSameNumberCell(0)).toBeFalse();
    });

    it('identifies notes that should be highlighted', () => {
      component.model.initBoard(puzzle);
      component.onCellSelected(0); // Cell with value 1
      
      // Note with digit 1 should be highlighted
      expect(component.shouldHighlightNote(1)).toBeTrue();
      
      // Other notes should not be highlighted
      expect(component.shouldHighlightNote(2)).toBeFalse();
      expect(component.shouldHighlightNote(5)).toBeFalse();
    });

    it('does not highlight notes when selected value is 0', () => {
      component.onCellSelected(1); // Cell with value 0
      
      // No notes should be highlighted
      for (let i = 1; i <= 9; i++) {
        expect(component.shouldHighlightNote(i)).toBeFalse();
      }
    });

    it('does not highlight notes when no cell selected', () => {
      component.selected.set(null);
      
      expect(component.shouldHighlightNote(5)).toBeFalse();
    });

    it('applies highlight classes correctly in template', () => {
      component.model.initBoard(puzzle);
      component.onCellSelected(0); // Select cell 0 with value 1
      fixture.detectChanges();
      
      const cellElements = fixture.debugElement.queryAll(By.css('app-cell-model'));
      
      // Cell 0 should be selected
      expect(cellElements[0].nativeElement.classList.contains('selected')).toBeTrue();
      
      // Cell 1 should be highlight-related (same row)
      expect(cellElements[1].nativeElement.classList.contains('highlight-related')).toBeTrue();
      
      // Cell 9 should be highlight-related (same column)
      expect(cellElements[9].nativeElement.classList.contains('highlight-related')).toBeTrue();
    });
  });

  describe('Combat Layer', () => {
    it('should clear floatingText when onFloatingTextComplete is called', () => {
      component.floatingText = { text: 'REFLECTED!', type: 'reflected' };
      component.onFloatingTextComplete();
      expect(component.floatingText).toBeNull();
    });

    it('should apply threat-border class when globalThreat is true', () => {
      component.globalThreat = true;
      fixture.detectChanges();
      const board = fixture.debugElement.query(By.css('.board'));
      expect(board.nativeElement.classList.contains('threat-border')).toBeTrue();
    });

    it('should apply pulse-row class when defuseType is row', () => {
      component.defuseType = 'row';
      fixture.detectChanges();
      const board = fixture.debugElement.query(By.css('.board'));
      expect(board.nativeElement.classList.contains('pulse-row')).toBeTrue();
    });

    it('should apply pulse-col class when defuseType is col', () => {
      component.defuseType = 'col';
      fixture.detectChanges();
      const board = fixture.debugElement.query(By.css('.board'));
      expect(board.nativeElement.classList.contains('pulse-col')).toBeTrue();
    });

    it('should apply pulse-box class when defuseType is box', () => {
      component.defuseType = 'box';
      fixture.detectChanges();
      const board = fixture.debugElement.query(By.css('.board'));
      expect(board.nativeElement.classList.contains('pulse-box')).toBeTrue();
    });

    it('should apply threat-cell class to targeted cell', () => {
      component.threatCell = 10;
      fixture.detectChanges();
      const cells = fixture.debugElement.queryAll(By.css('app-cell-model'));
      expect(cells[10].nativeElement.classList.contains('threat-cell')).toBeTrue();
      expect(cells[11].nativeElement.classList.contains('threat-cell')).toBeFalse();
    });

    it('should apply ghost-target class to ghost cells', () => {
      component.ghostCells = [5, 10, 15];
      fixture.detectChanges();
      const cells = fixture.debugElement.queryAll(By.css('app-cell-model'));
      expect(cells[5].nativeElement.classList.contains('ghost-target')).toBeTrue();
      expect(cells[10].nativeElement.classList.contains('ghost-target')).toBeTrue();
      expect(cells[15].nativeElement.classList.contains('ghost-target')).toBeTrue();
      expect(cells[20].nativeElement.classList.contains('ghost-target')).toBeFalse();
    });
  });
});

