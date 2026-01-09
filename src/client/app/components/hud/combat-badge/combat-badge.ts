import {
  Component, Input, OnDestroy, signal, computed, type OnChanges, type SimpleChanges
} from '@angular/core';

import { DefuseType } from '../../../../types/enums';

import type { WritableSignal, Signal } from '@angular/core';
import type { CombatState } from '../../../../types/combat';


/**
 * CombatBadgeComponent displays incoming attack warnings in the player header.
 * Shows the PUP icon, defuse type icon, and countdown timer.
 * Pulses/flashes when timer is critical (<3s).
 */
@Component({
  selector: 'app-combat-badge',
  standalone: true,
  templateUrl: './combat-badge.html',
  styleUrl: './combat-badge.scss'
})
export default class CombatBadgeComponent implements OnChanges, OnDestroy {
  @Input()
  combatState: CombatState | null = null;

  @Input()
  pupIconPath: string = '';

  /** Signal tracking remaining time in milliseconds */
  readonly remainingTime: WritableSignal<number> = signal(0);

  /** Computed signal for formatted countdown display */
  readonly countdownDisplay: Signal<string> = computed(() => {
    const ms = this.remainingTime();
    if (ms <= 0) {
      return '00:00';
    }
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  /** Computed signal to determine if timer is critical (<3s) */
  readonly isCritical: Signal<boolean> = computed(() => {
    return this.remainingTime() > 0 && this.remainingTime() < 3000;
  });

  /** Checks if badge should be visible */
  isVisible(): boolean {
    return this.combatState !== null && this.remainingTime() > 0;
  }

  private timerInterval: ReturnType<typeof setInterval> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['combatState']) {
      this.updateTimer();
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  /**
   * Gets the icon path for the defuse type.
   */
  getDefuseTypeIcon(): string {
    if (!this.combatState) {
      return '';
    }

    switch (this.combatState.defuseType) {
      case DefuseType.ROW:
        return '/assets/icons/row-icon.svg';
      case DefuseType.COL:
        return '/assets/icons/col-icon.svg';
      case DefuseType.BOX:
        return '/assets/icons/box-icon.svg';
      default:
        return '';
    }
  }

  /**
   * Gets a human-readable label for the defuse type.
   */
  getDefuseTypeLabel(): string {
    if (!this.combatState) {
      return '';
    }

    switch (this.combatState.defuseType) {
      case DefuseType.ROW:
        return 'Row';
      case DefuseType.COL:
        return 'Col';
      case DefuseType.BOX:
        return 'Box';
      default:
        return '';
    }
  }

  private updateTimer(): void {
    this.clearTimer();

    if (!this.combatState) {
      this.remainingTime.set(0);
      return;
    }

    const updateRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, this.combatState!.endTime - now);
      this.remainingTime.set(remaining);

      if (remaining <= 0) {
        this.clearTimer();
      }
    };

    // Initial update
    updateRemaining();

    // Update every 100ms for smooth countdown
    this.timerInterval = setInterval(updateRemaining, 100);
  }

  private clearTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
