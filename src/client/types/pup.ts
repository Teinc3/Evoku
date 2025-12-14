export interface PupSlotState {
  pupID: number | null;
  name: string | null;
  icon: string | null;
  status: 'empty' | 'ready' | 'cooldown';
  cooldownRemainingMs?: number;
  cooldownExpiresAt?: number;
}

