import type PlayerActions from "@shared/types/enums/actions/match/player";


export interface PlayerTimeData {
  /** Current best estimate of client-server time offset in milliseconds.
   * Positive values mean client is ahead of server. */
  offset: number;
  /** Round-trip time (ping) in milliseconds,
   * representing the total time for a packet to travel from server to client and back. */
  rtt: number;
  /** Array of recent offset samples used for median filtering
   * to provide robust offset calculations against network jitter. */
  offsetSamples: number[];
  /** Baseline offset from the first synchronization,
   * used as reference point for cumulative drift calculations. */
  initialOffset: number;
  /** Client timestamp when the first synchronization occurred,
   * used for drift validation over match lifecycle. */
  initialClientTime: number;
  /** Server timestamp when the first synchronization occurred,
   * used for drift validation over match lifecycle. */
  initialServerTime: number;
  /** Server timestamp when this time data was last updated,
   * used for cleanup and staleness detection. */
  lastUpdated: number;
}

export interface PlayerActionData {
  /** The specific player action enum type used for action-specific cooldown validation. */
  action: PlayerActions;
  /** Client-side timestamp when the action was initiated,
   * used for monotonic validation and cooldown calculations. */
  clientTime: number;
  /** Server-side timestamp when the action was received and processed,
   * used for rate limiting and anti-spam protection. */
  serverTime: number;
}
