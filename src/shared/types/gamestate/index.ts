import type MatchStatus from "../enums/matchstatus";
import type { IPUPSlotState } from "./powerups";
import type { IBoardState } from "./board";


export interface IMatchState {
  status: MatchStatus;
  phase: number;
  currentPUPID?: number;
}

export interface IPlayerState<SpecificBoardState extends IBoardState = IBoardState> {
  playerID: number;
  gameState?: GameState<SpecificBoardState>;
}

export interface GameState<SpecificBoardState extends IBoardState = IBoardState> {
  boardState: SpecificBoardState;
  pupProgress: number;
  powerups: readonly [IPUPSlotState, IPUPSlotState, IPUPSlotState];
}
