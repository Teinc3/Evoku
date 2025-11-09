/**
 * Interface representing an effect that can be applied to a cell.
 */
export default interface ICellEffectState {
  // type: EffectType; // Not defined yet
  /**
   * The type of the effect, represented as a number.
   */
  startedAt: number;
  /**
   * The time when the effect will end, if it is a timed effect.
   * If not specified, the effect is permanent.
   */
  lastUntil?: number;
}
