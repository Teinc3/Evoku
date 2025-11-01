/** Response for current online count endpoint */
export interface IOnlineStats {
  /** Current number of online users */
  online: number;
  /** Timestamp (epoch milliseconds) when the count was recorded */
  at: number;
}

/** Single data point in historical online stats */
export interface IOnlineDataPoint {
  /** Timestamp (epoch milliseconds) when the count was recorded */
  at: number;
  /** Number of online users at that time */
  online: number;
}

/** Valid time ranges for historical stats query */
export type OnlineStatsRange = '1h' | '24h' | '7d';

/** Valid output formats for historical stats query */
export type OnlineStatsFormat = 'json' | 'text';
