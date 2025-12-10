import type { MatchStatus } from "./enums";


/**
 * Callback interface for GameLogic to communicate with external systems.
 */
export interface GameLogicCallbacks {
  getMatchStatus: () => MatchStatus;
  onProgressUpdate: (
    isBoard: boolean,
    progressData: { playerID: number; progress: number }[]
  ) => void;
}
