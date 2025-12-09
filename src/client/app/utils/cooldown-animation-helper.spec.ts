import CooldownAnimationHelper from './cooldown-animation-helper';


describe('CooldownAnimationHelper', () => {
  let helper: CooldownAnimationHelper;

  beforeEach(() => {
    helper = new CooldownAnimationHelper();
  });

  afterEach(() => {
    helper.reset();
  });

  it('should be created', () => {
    expect(helper).toBeTruthy();
    expect(helper.transitionDuration()).toBe('0s');
    expect(helper.currentAngle()).toBe(0);
  });

  it('starts animation for fresh pending cooldown', done => {
    const now = performance.now();
    const pendingEnd = now + 5000;

    helper.checkCooldownChanges(pendingEnd, undefined);

    // After RAF double-buffer, animation should start
    requestAnimationFrame(() => {
      // Duration should be approximately 5s (allowing for RAF overhead)
      const duration = parseFloat(helper.transitionDuration());
      expect(duration).toBeGreaterThan(4.9);
      expect(duration).toBeLessThanOrEqual(5);

      requestAnimationFrame(() => {
        expect(helper.currentAngle()).toBe(0);
        done();
      });
    });
  });

  it('starts animation for fresh confirmed cooldown', done => {
    const now = performance.now();
    const normalEnd = now + 3000;

    helper.checkCooldownChanges(undefined, normalEnd);

    requestAnimationFrame(() => {
      // Duration should be approximately 3s (allowing for RAF overhead)
      const duration = parseFloat(helper.transitionDuration());
      expect(duration).toBeGreaterThan(2.9);
      expect(duration).toBeLessThanOrEqual(3);

      requestAnimationFrame(() => {
        expect(helper.currentAngle()).toBe(0);
        done();
      });
    });
  });

  it('transitions from pending to confirmed cooldown', done => {
    const now = performance.now();
    const pendingEnd = now + 5000;
    const confirmedEnd = now + 4000;

    // Start pending
    helper.checkCooldownChanges(pendingEnd, undefined);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Now transition to confirmed (pending cleared, normal end set)
        helper.checkCooldownChanges(undefined, confirmedEnd);

        // Duration should be approximately 4s (allowing for RAF overhead)
        const duration = parseFloat(helper.transitionDuration());
        expect(duration).toBeGreaterThan(3.9);
        expect(duration).toBeLessThanOrEqual(4);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            expect(helper.currentAngle()).toBe(0);
            done();
          });
        });
      });
    });
  });

  it('does not restart animation if normalEnd remains unchanged', done => {
    const now = performance.now();
    const normalEnd = now + 3000;

    helper.checkCooldownChanges(undefined, normalEnd);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const angleAfterFirst = helper.currentAngle();
        const durationAfterFirst = helper.transitionDuration();

        // Call again with same value
        helper.checkCooldownChanges(undefined, normalEnd);

        // Should not restart - angle and duration remain the same
        expect(helper.currentAngle()).toBe(angleAfterFirst);
        expect(helper.transitionDuration()).toBe(durationAfterFirst);
        done();
      });
    });
  });

  it('ignores expired normalEnd on transition', () => {
    const now = performance.now();
    const expiredEnd = now - 1000;

    helper.checkCooldownChanges(undefined, expiredEnd);

    // Should not start animation for expired cooldown
    expect(helper.currentAngle()).toBe(0);
    expect(helper.transitionDuration()).toBe('0s');
  });

  it('clears cleanup timer when new animation starts before previous finishes', done => {
    const now = performance.now();
    const firstEnd = now + 1000;
    const secondEnd = now + 5000;

    helper.checkCooldownChanges(undefined, firstEnd);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Before first animation finishes, start a new one
        helper.checkCooldownChanges(undefined, secondEnd);

        // Duration should be approximately 5s (allowing for RAF overhead)
        const duration = parseFloat(helper.transitionDuration());
        expect(duration).toBeGreaterThan(4.9);
        expect(duration).toBeLessThanOrEqual(5);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            expect(helper.currentAngle()).toBe(0);
            done();
          });
        });
      });
    });
  });

  it('handles rapid pending cooldown changes', done => {
    const now = performance.now();
    const firstPending = now + 3000;
    const secondPending = now + 5000;

    helper.checkCooldownChanges(firstPending, undefined);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // First animation should have started
        expect(helper.currentAngle()).toBe(0);

        // Pending time increased - should restart animation
        helper.checkCooldownChanges(secondPending, undefined);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Duration should be approximately 5s (allowing for RAF overhead)
            const duration = parseFloat(helper.transitionDuration());
            expect(duration).toBeGreaterThan(4.9);
            expect(duration).toBeLessThanOrEqual(5);
            expect(helper.currentAngle()).toBe(0);
            done();
          });
        });
      });
    });
  });

  it('cleans up timer on destroy', () => {
    const now = performance.now();
    const pendingEnd = now + 5000;

    helper.checkCooldownChanges(pendingEnd, undefined);

    // Destroy before animation completes
    helper.reset();

    // Should not throw
    // (no errors thrown, state remains as is)
    expect(helper).toBeDefined();
  });

  it('handles zero remaining time gracefully', done => {
    const now = performance.now();
    const pendingEnd = now - 100; // Already passed

    helper.checkCooldownChanges(pendingEnd, undefined);

    requestAnimationFrame(() => {
      // Should clamp to 0
      expect(helper.transitionDuration()).toBe('0s');
      requestAnimationFrame(() => {
        expect(helper.currentAngle()).toBe(0);
        done();
      });
    });
  });
});
