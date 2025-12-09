import ClientCellModel from './Cell';


describe('ClientCellModel', () => {
  beforeEach(() => {
    jasmine.clock().install();
  });
  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('setPending sets pending value and cooldown when time provided', () => {
    const c = new ClientCellModel();
    const now = performance.now();
    expect(c.setPending(5, now)).toBeTrue();
    expect(c.pendingCellState.pendingValue).toBe(5);
    expect(c.pendingCellState.pendingCooldownEnd).toBeGreaterThan(now);
    expect(c.hasPending()).toBeTrue();
  });

  it('confirmSet clears pending then sets value if valid', () => {
    const c = new ClientCellModel();
    c.setPending(4, performance.now());
    expect(c.pendingCellState.pendingValue).toBe(4);
    expect(c.confirmSet(4, performance.now())).toBeTrue();
    expect(c.pendingCellState.pendingValue).toBeUndefined();
    expect(c.value).toBe(4);
  });

  it('confirmSet rejects duplicate value after clearing pending', () => {
    const c = new ClientCellModel();
    c.setPending(3, performance.now());
    // First confirm works
    expect(c.confirmSet(3, performance.now())).toBeTrue();
    // Second confirm with same value should fail (validate false)
    expect(c.confirmSet(3, performance.now())).toBeFalse();
  });

  it('getDisplayValue prefers pending over actual', () => {
    const c = new ClientCellModel();
    c.setPending(9, performance.now());
    expect(c.getDisplayValue()).toBe(9);
    c.clearPending();
    expect(c.getDisplayValue()).toBe(0);
    c.confirmSet(5, performance.now());
    expect(c.getDisplayValue()).toBe(5);
  });

  it('validate blocks identical pending or placed values, allows different', () => {
    const c = new ClientCellModel();
    c.setPending(4, performance.now());
    expect(c.validate(4, performance.now())).toBeFalse(); // Same as pending
    // Different value while pending should be allowed assuming base validate allows
    expect(c.validate(5, performance.now())).toBeTrue();
    c.confirmSet(4, performance.now());
    expect(c.validate(4, performance.now())).toBeFalse(); // Same as actual
  });

  it('wipeNotes returns true only when notes existed', () => {
    const c = new ClientCellModel();
    expect(c.wipeNotes()).toBeFalse();
    c.notes = [1,2];
    expect(c.wipeNotes()).toBeTrue();
    expect(c.notes.length).toBe(0);
  });
});
