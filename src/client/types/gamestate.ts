import type BaseEffectModel from "@shared/models/effect";


export interface IPendingCellState {
  pendingValue: number;
  pendingCooldownEnd: number;
  pendingEffects: BaseEffectModel[];
};
