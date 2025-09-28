import ClientBoardModel from './Board';


// Helper to create a fresh model with seeded empty board
function createModel(): ClientBoardModel {
  const m = new ClientBoardModel();
  for (let i = 0; i < 81; i++) {
    m.board[i] = new m.CellModelClass(0, false);
  }
  return m;
}

describe('ClientBoardModel', () => {
  beforeEach(() => {
    // Use modern fake timers for setTimeout in autoAccept tests
    jasmine.clock().install();
  });
  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('setPendingCell succeeds and sets pending cooldown + hasPendingChanges()', () => {
    const m = createModel();
    const now = performance.now();
    const ok = m.setPendingCell(0, 5, now);
    expect(ok).toBeTrue();
    expect(m.board[0].pendingCellState.pendingValue).toBe(5);
    expect(m.pendingGlobalCooldownEnd).toBeGreaterThan(now);
    expect(m.hasPendingChanges()).toBeTrue();
    expect(m.pendingGlobalCooldownEnd).toBeDefined();
    expect(m.getDisplayGlobalCooldownEnd()).toBe(m.pendingGlobalCooldownEnd as number);
  });

  it('setPendingCell fails validation for out of range index and under cooldown', () => {
    const m = createModel();
    const now = performance.now();
    // Invalid index (negative) - cast to number to satisfy signature but logic should reject
    expect(m.setPendingCell(-1 as number, 3, now)).toBeFalse();
    // Establish a pending with cooldown
    expect(m.setPendingCell(0, 4, now)).toBeTrue();
    // Time before global cooldown end should reject
    const early = m.getDisplayGlobalCooldownEnd() - 10;
    expect(m.setPendingCell(1, 7, early)).toBeFalse();
  });

  it('setPendingCell returns false for fixed cell and while global cooldown active', () => {
    const m = createModel();
    // Make cell fixed
    m.board[2] = new m.CellModelClass(5, true);
    const now = performance.now();
    expect(m.setPendingCell(2, 7, now)).toBeFalse();
    // Establish cooldown on another cell
    expect(m.setPendingCell(0, 3, now)).toBeTrue();
    const early = m.getDisplayGlobalCooldownEnd() - 5;
    expect(m.setPendingCell(1, 9, early)).toBeFalse();
  });

  it('setPendingCell returns false when cell already has a confirmed value', () => {
    const m = createModel();
    const now = performance.now();
    // confirm a value so cell.value > 0
    expect(m.setPendingCell(0, 8, now)).toBeTrue();
    expect(m.confirmCellSet(0, 8, now)).toBeTrue();
    expect(m.board[0].value).toBe(8);
    // Attempt to set another pending value should fail validation at super.validate
    const later = m.getDisplayGlobalCooldownEnd() + 5;
    expect(m.setPendingCell(0, 3, later)).toBeFalse();
  });

  it('confirmCellSet applies cooldown and clears pending', () => {
    const m = createModel();
    const now = performance.now();
    m.setPendingCell(0, 9, now);
    expect(m.confirmCellSet(0, 9, now)).toBeTrue();
    expect(m.board[0].value).toBe(9);
    expect(m.pendingGlobalCooldownEnd).toBeUndefined();
    expect(m.globalLastCooldownEnd).toBeGreaterThan(now);
  });

  it('rejectCellSet clears pending without updating value', () => {
    const m = createModel();
    const now = performance.now();
    m.setPendingCell(0, 6, now);
    m.rejectCellSet(0);
    expect(m.board[0].pendingCellState.pendingValue).toBeUndefined();
    expect(m.board[0].value).toBe(0);
    expect(m.hasPendingChanges()).toBeFalse();
  });

  it('toggleNote obeys constraints (no toggle if fixed/value/pending)', () => {
    const m = createModel();
    // Normal toggle ok
    expect(m.toggleNote(0, 3)).toBeTrue();
    expect(m.board[0].notes).toEqual([3]);
    // Second toggle removes
    expect(m.toggleNote(0, 3)).toBeTrue();
    expect(m.board[0].notes).toEqual([]);
    // Fixed cell
    m.board[1] = new m.CellModelClass(5, true);
    expect(m.toggleNote(1, 2)).toBeFalse();
    // Value > 0 cell
    m.board[2] = new m.CellModelClass(4, false);
    expect(m.toggleNote(2, 7)).toBeFalse();
    // Pending cell
    m.setPendingCell(3, 8, performance.now());
    expect(m.toggleNote(3, 1)).toBeFalse();
  });

  it('clearCell wipes value and notes unless fixed', () => {
    const m = createModel();
    m.board[0].notes = [1,2,3];
    m.board[0].update(5, undefined);
    m.clearCell(0);
    expect(m.board[0].value).toBe(0);
    expect(m.board[0].notes).toEqual([]);
    // Fixed path
    m.board[1] = new m.CellModelClass(7, true);
    m.board[1].notes = [2];
    m.clearCell(1);
    expect(m.board[1].value).toBe(7);
    expect(m.board[1].notes).toEqual([2]);
  });

  it('autoAcceptPending confirms after timeout', () => {
    const m = createModel();
    m.autoAcceptPending = true;
    const now = performance.now();
    m.setPendingCell(0, 4, now);
    expect(m.board[0].pendingCellState.pendingValue).toBe(4);
    jasmine.clock().tick(1000); // advance 1s
    expect(m.board[0].pendingCellState.pendingValue).toBeUndefined();
    expect(m.board[0].value).toBe(4);
  });

  it('validate returns false during global cooldown', () => {
    const m = createModel();
    const now = performance.now();
    m.setPendingCell(0, 2, now);
    const early = m.getDisplayGlobalCooldownEnd() - 1;
    expect(m.validate(1, 3, early)).toBeFalse();
    const after = m.getDisplayGlobalCooldownEnd() + 1;
    expect(m.validate(1, 3, after)).toBeTrue();
  });

  it('confirmCellSet and rejectCellSet handle out-of-range indices', () => {
    const m = createModel();
    expect(m.confirmCellSet(-1, 5, performance.now())).toBeFalse();
    expect(m.confirmCellSet(100, 5, performance.now())).toBeFalse();
    // reject out-of-range should not throw
    m.rejectCellSet(-1);
    m.rejectCellSet(100);
  });

  it('clearCell out-of-range and fixed no-op paths', () => {
    const m = createModel();
    // Out-of-range no throw
    m.clearCell(-1);
    m.clearCell(100);
    // Fixed cell not cleared
    m.board[5] = new m.CellModelClass(7, true);
    m.board[5].notes = [1];
    m.clearCell(5);
    expect(m.board[5].value).toBe(7);
    expect(m.board[5].notes).toEqual([1]);
  });

});
