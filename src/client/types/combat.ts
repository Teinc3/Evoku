export enum CombatDefuseType {
  ROW = 'row',
  COL = 'col',
  BOX = 'box',
  GLOBAL = 'global'
}

export interface CombatIncomingThreat {
  id: string;
  pupName: string;
  icon: string;
  defuseType: CombatDefuseType;
  targetIndex?: number;
  targetCells?: number[];
  createdAtMs: number;
  expiresAtMs: number;
}

export type CombatOutcomeTone = 'hit' | 'reflected';

export interface CombatOutcomeText {
  id: string;
  text: string;
  tone: CombatOutcomeTone;
  createdAtMs: number;
  expiresAtMs: number;
}
