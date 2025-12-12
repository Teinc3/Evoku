import { Component, Input, computed, type Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import DefuseType from '../../../../types/enums/defuse-type';

import type { ThreatData } from '../../../../types/combat';


/**  Animation duration constants synced with CSS */
const ANIMATION_DURATIONS = {
  PULSE_CRITICAL: 500, // ms - fast pulse when < 3s
  PULSE_NORMAL: 1000,  // ms - normal pulse
} as const;

@Component({
  selector: 'app-combat-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './combat-badge.component.html',
  styleUrl: './combat-badge.component.scss'
})
export default class CombatBadgeComponent {
  @Input() threatData: ThreatData | null = null;

  /** Expose DefuseType for template */
  public readonly DefuseType = DefuseType;

  /** Expose animation durations for template */
  public readonly ANIMATION_DURATIONS = ANIMATION_DURATIONS;

  /**
   * Computed signal for formatted countdown timer
   * Format: "3.4s" or "0.5s"
   */
  public readonly timerDisplay: Signal<string> = computed(() => {
    if (!this.threatData) {
      return '';
    }
    const seconds = this.threatData.timeRemainingMs / 1000;
    return `${seconds.toFixed(1)}s`;
  });

  /**
   * Computed signal for critical state (time < 3s)
   */
  public readonly isCritical: Signal<boolean> = computed(() => {
    if (!this.threatData) {
      return false;
    }
    return this.threatData.timeRemainingMs < 3000;
  });

  /**
   * Get defuse type icon path
   */
  get defuseIcon(): string {
    if (!this.threatData) {
      return '';
    }
    
    switch (this.threatData.defuseType) {
      case DefuseType.ROW:
        return '/assets/icons/defuse-row.svg';
      case DefuseType.COL:
        return '/assets/icons/defuse-col.svg';
      case DefuseType.BOX:
        return '/assets/icons/defuse-box.svg';
      case DefuseType.GLOBAL:
        return '/assets/icons/defuse-global.svg';
      default:
        return '';
    }
  }

  /**
   * Get defuse type label for accessibility
   */
  get defuseLabel(): string {
    if (!this.threatData) {
      return '';
    }
    
    switch (this.threatData.defuseType) {
      case DefuseType.ROW:
        return 'Complete a row to defuse';
      case DefuseType.COL:
        return 'Complete a column to defuse';
      case DefuseType.BOX:
        return 'Complete a box to defuse';
      case DefuseType.GLOBAL:
        return 'Global threat';
      default:
        return '';
    }
  }
}
