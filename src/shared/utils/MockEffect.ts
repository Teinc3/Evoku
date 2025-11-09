import BaseEffectModel from "../models/effect";


class MockEffect extends BaseEffectModel {
  constructor(
    startedAt: number,
    lastUntil?: number,
    private _canBlockSet: boolean = true,
    private _canBlockProgress: boolean = true
  ) {
    super(startedAt, lastUntil);
  }

  protected get canBlockSet(): boolean {
    return this._canBlockSet;
  }

  protected get canBlockProgress(): boolean {
    return this._canBlockProgress;
  }
}

/**
 * Factory function to create MockEffect instances with configurable blocking behavior.
 * 
 * @param startedAt - Timestamp when the effect started
 * @param lastUntil - Optional timestamp when the effect ends
 * @param canBlockSet - Whether this effect can block setting new values (default: true)
 * @param canBlockProgress - Whether this effect can block progress contribution (default: true)
 * @returns A new MockEffect instance
 */
export function createMockEffect(
  startedAt: number,
  lastUntil?: number,
  canBlockSet: boolean = true,
  canBlockProgress: boolean = true
): BaseEffectModel {
  return new MockEffect(startedAt, lastUntil, canBlockSet, canBlockProgress);
}

// Keep the class as default export for backward compatibility during transition
export default MockEffect;
