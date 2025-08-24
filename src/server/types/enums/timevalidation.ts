/**
 * Enum for time validation failure reasons
 * All values are negative integers,
 * and can be filtered out through checking non-negative values.
 */
enum TimeValidationReason {
  /** The player does not have any established synchronization profile */
  NO_SYNC_PROFILE = -1,
  /** The player's client timestamp is not monotonically increasing (Not STRICTLY) */
  MONOTONIC_VIOLATION = -2,
  /** The player has exceeded the rate limit for actions */
  RATE_LIMIT = -3,
  /** The player's cumulative delta drift has exceeded the allowed threshold */
  DRIFT_EXCEEDED = -4
}

export default TimeValidationReason;