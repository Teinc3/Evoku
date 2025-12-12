import { Component, Input, computed, signal } from '@angular/core';

import type { CombatBadgeState, DefuseType } from '../../../../types/combat';


@Component({
  selector: 'app-combat-badge',
  standalone: true,
  templateUrl: './combat-badge.component.html',
  styleUrl: './combat-badge.component.scss'
})
export default class CombatBadgeComponent {
  private static readonly DEFAULT_CRITICAL_MS = 3000;

  @Input()
  set incomingIcon(value: string) {
    this._state.update(prev => ({
      ...prev,
      incomingIcon: value || 'PUP'
    }));
  }

  @Input()
  set defuseType(value: DefuseType) {
    this._state.update(prev => ({
      ...prev,
      defuseType: value ?? 'row'
    }));
  }

  @Input()
  set countdownMs(value: number) {
    const safe = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    this._state.update(prev => ({
      ...prev,
      countdownMs: safe
    }));
  }

  @Input()
  set criticalThresholdMs(value: number | undefined) {
    this._state.update(prev => ({
      ...prev,
      criticalThresholdMs: value
    }));
  }

  private _state = signal<CombatBadgeState>({
    incomingIcon: 'PUP',
    defuseType: 'row',
    countdownMs: 0,
    criticalThresholdMs: CombatBadgeComponent.DEFAULT_CRITICAL_MS
  });

  protected state = this._state;

  protected countdownText = computed(() => {
    const ms = this._state().countdownMs;
    const totalSec = Math.floor(ms / 1000);
    const mm = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const ss = (totalSec % 60)
      .toString()
      .padStart(2, '0');
    return `${mm}:${ss}`;
  });

  protected defuseLabel = computed(() => {
    const type = this._state().defuseType;
    if (type === 'col') {
      return 'COL';
    }
    if (type === 'box') {
      return 'BOX';
    }
    return 'ROW';
  });

  protected isCritical = computed(() => {
    const threshold = this._state().criticalThresholdMs
      ?? CombatBadgeComponent.DEFAULT_CRITICAL_MS;
    return this._state().countdownMs <= threshold;
  });
}
