import type IBoardState from "./board";
import type PUPState from "./powerups";
import type TimeSyncState from "./timesync";


export default interface IPlayerState {
  playerID: number;
  gameState?: GameState;
  timeSyncState?: TimeSyncState;
}

export interface GameState {
  boardState: IBoardState;
  pupProgress: number;
  powerups: Array<PUPState>;
}