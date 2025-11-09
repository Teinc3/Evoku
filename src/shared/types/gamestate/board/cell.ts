import type ICellEffectState from "./effect";


export type BoardCellStates = ICellState[];

export default interface ICellState {
  value: number;
  fixed: boolean; // Whether the cell is fixed or not (prefilled)
  effects: ICellEffectState[];
  lastCooldownEnd: number;
}
