import type MatchStatus from "../enums/matchstatus";
import type { IPUPSlotState } from "./powerups";
import type { IBoardState } from "./board";


export interface IMatchState {
  status: MatchStatus;
  phase: number;
}

export interface IPlayerState<
  SpecificBoardState extends IBoardState = IBoardState,
  SpecificPUPSlotState extends IPUPSlotState = IPUPSlotState
> {
  playerID: number;
  gameState?: GameState<SpecificBoardState, SpecificPUPSlotState>;
}

export interface GameState<
  SpecificBoardState extends IBoardState = IBoardState,
  SpecificPUPSlotState extends IPUPSlotState = IPUPSlotState
> {
  boardState: SpecificBoardState;
  pupProgress: number;
  powerups: [SpecificPUPSlotState, SpecificPUPSlotState, SpecificPUPSlotState];
}
