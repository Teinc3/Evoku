import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';


export interface CombatBadgeData {
  pupIcon: string;
  defuseType: 'row' | 'col' | 'box';
  timeRemaining: number;
}

@Component({
  selector: 'app-combat-badge',
  standalone: true,
  imports: [NgIf],
  templateUrl: './combat-badge.component.html',
  styleUrl: './combat-badge.component.scss'
})
export default class CombatBadgeComponent {
  static readonly FLASH_THRESHOLD_MS = 3000;

  @Input() data: CombatBadgeData | null = null;

  get shouldFlash(): boolean {
    return !!this.data && this.data.timeRemaining < CombatBadgeComponent.FLASH_THRESHOLD_MS;
  }

  get defuseIcon(): string {
    if (!this.data) return '';
    switch (this.data.defuseType) {
      case 'row': return '→';
      case 'col': return '↓';
      case 'box': return '⊞';
      default: return '';
    }
  }

  get formattedTime(): string {
    if (!this.data) return '00:00';
    const totalMs = this.data.timeRemaining;
    const seconds = Math.floor(totalMs / 1000);
    const centiseconds = Math.floor((totalMs % 1000) / 10);
    return `${seconds.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
  }
}
