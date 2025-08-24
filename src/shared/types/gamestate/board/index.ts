import type { BoardCellStates } from "./cell";


export default interface IBoardState {
  globalLastCooldownEnd: number;
  board: BoardCellStates;
}