import type PUPState from "./powerups";
import type IBoardState from "./board";


export default interface IPlayerState<SpecificBoardState extends IBoardState = IBoardState> {
  playerID: number;
  gameState?: GameState<SpecificBoardState>;
}

export interface GameState<SpecificBoardState extends IBoardState = IBoardState> {
  boardState: SpecificBoardState;
  pupProgress: number;
  powerups: Array<PUPState>;
}