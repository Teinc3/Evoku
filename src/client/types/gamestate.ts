import type BaseEffectModel from "@shared/models/Effect";


export interface IPendingCellState {
  pendingValue: number;
  pendingCooldownEnd: number;
  pendingEffects: BaseEffectModel[];
};
