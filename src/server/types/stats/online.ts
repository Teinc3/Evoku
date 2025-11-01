/** Server statistics snapshot */
export interface IServerStats {
  /** Number of active sessions (online users) */
  activeSessions: number;
  /** Number of active rooms */
  activeRooms: number;
  /** Timestamp (epoch milliseconds) when stats were recorded */
  at: number;
}

/** Valid time ranges for stats query */
export type StatsRange = '1h' | '24h' | '7d';

