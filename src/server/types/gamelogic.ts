import type MatchStatus from "./enums/matchstatus";


/**
 * Callback interface for GameLogic to communicate with external systems.
 */
export interface GameLogicCallbacks {
  getMatchStatus: () => MatchStatus;
  onBoardProgressUpdate: (progressData: { playerID: number; progress: number }[]) => void;
}
