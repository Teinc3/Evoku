/** Callback interface for GameLogic to communicate with external systems */
export interface GameLogicCallbacks {
  onProgressUpdate: (
    isBoard: boolean,
    progressData: { playerID: number; progress: number }[]
  ) => void;
}
