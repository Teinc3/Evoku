import type TimeSyncState from "./timesync";
import type PUPState from "./powerups";
import type IBoardState from "./board";


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