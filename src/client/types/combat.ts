export type DefuseType = 'row' | 'col' | 'box';

export interface CombatBadgeState {
  incomingIcon: string;
  defuseType: DefuseType;
  countdownMs: number;
  criticalThresholdMs?: number;
}

export type FloatingTextTone = 'reflect' | 'hit';

export interface FloatingTextMessage {
  id: string;
  text: string;
  tone: FloatingTextTone;
  /** Optional target cell index (0-80) to anchor text; center used if omitted. */
  cellIndex?: number;
}
