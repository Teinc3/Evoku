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
  @Input() data: CombatBadgeData | null = null;

  get shouldFlash(): boolean {
    return !!this.data && this.data.timeRemaining < 3000;
  }

  get formattedTime(): string {
    if (!this.data) return '00:00';
    const totalMs = this.data.timeRemaining;
    const seconds = Math.floor(totalMs / 1000);
    const centiseconds = Math.floor((totalMs % 1000) / 10);
    return `${seconds.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
  }
}
