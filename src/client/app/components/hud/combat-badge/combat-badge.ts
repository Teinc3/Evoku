import { Component, Input } from '@angular/core';

import { CombatDefuseType, type CombatIncomingThreat } from '../../../../types/combat';


@Component({
  selector: 'app-combat-badge',
  standalone: true,
  templateUrl: './combat-badge.html',
  styleUrl: './combat-badge.scss'
})
export default class CombatBadgeComponent {
  private _incoming: CombatIncomingThreat | null = null;
  private _currentTimeMs: number | null = null;
  private durationMs: number = 0;

  @Input()
  set incoming(value: CombatIncomingThreat | null) {
    this._incoming = value;
    this.durationMs = this.computeDurationMs();
  }

  get incoming(): CombatIncomingThreat | null {
    return this._incoming;
  }

  @Input()
  set currentTimeMs(value: number | null) {
    this._currentTimeMs = value;
  }

  get currentTimeMs(): number | null {
    return this._currentTimeMs;
  }

  get isActive(): boolean {
    return this.incoming !== null;
  }

  get isCritical(): boolean {
    return this.remainingMs < 3000;
  }

  get remainingMs(): number {
    if (!this.incoming || this.currentTimeMs === null) {
      return 0;
    }
    return Math.max(0, this.incoming.expiresAtMs - this.currentTimeMs);
  }

  get progressPercent(): number {
    if (!this.incoming || this.durationMs === 0) {
      return 0;
    }
    const ratio = this.remainingMs / this.durationMs;
    return Math.max(0, Math.min(100, ratio * 100));
  }

  get countdownText(): string {
    if (!this.incoming) {
      return '--:--';
    }
    const totalMs = this.remainingMs;
    const seconds = Math.floor(totalMs / 1000);
    const hundredths = Math.floor((totalMs % 1000) / 10)
      .toString()
      .padStart(2, '0');
    const paddedSeconds = seconds.toString().padStart(2, '0');
    return `${paddedSeconds}:${hundredths}`;
  }

  get defuseLabel(): string {
    switch (this.incoming?.defuseType) {
      case CombatDefuseType.ROW:
        return 'Row Defuse';
      case CombatDefuseType.COL:
        return 'Col Defuse';
      case CombatDefuseType.BOX:
        return 'Box Defuse';
      case CombatDefuseType.GLOBAL:
        return 'Global';
      default:
        return 'Idle';
    }
  }

  private computeDurationMs(): number {
    if (!this.incoming) {
      return 0;
    }
    const duration = this.incoming.expiresAtMs - this.incoming.createdAtMs;
    return duration > 0 ? duration : 0;
  }
}
