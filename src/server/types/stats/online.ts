/** Server statistics snapshot */
export interface IServerStats {
  /** Number of active sessions (online users) */
  activeSessions: number;
  /** Number of active rooms */
  activeRooms: number;
  /** Server uptime in milliseconds */
  uptime: number;
  /** Timestamp (epoch milliseconds) when stats were recorded */
  at: number;
}

/** Valid time ranges for stats query */
export enum StatsRange {
  /** 1 hour */
  ONE_HOUR = '1h',
  /** 1 day */
  ONE_DAY = '1d',
  /** 1 week */
  ONE_WEEK = '1w',
}

