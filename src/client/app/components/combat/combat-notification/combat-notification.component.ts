import { Component, EventEmitter, Input, Output } from '@angular/core';

import pupConfig from '@config/shared/pup.json';

import type { IPUPSlotState } from '@shared/types/gamestate/powerups';


@Component({
  selector: 'app-combat-notification',
  standalone: true,
  templateUrl: './combat-notification.component.html',
  styleUrl: './combat-notification.component.scss',
})
export default class CombatNotificationComponent {
  @Input({ required: true })
  public isOutbound!: boolean;
  @Input({ required: true })
  public defuseObjective!: number;
  @Input({ required: true })
  public pupSlot!: IPUPSlotState;
  @Output()
  public readonly pupSlotClicked: EventEmitter<number>;

  protected pupConfig = pupConfig; // Expose to template

  constructor() {
    this.pupSlotClicked = new EventEmitter<number>();
  }

  protected get timerLabel(): string {
    const msLeft
      = (this.pupSlot.pendingCooldownEnd ?? this.pupSlot.lastCooldownEnd) - performance.now();
    const secondsDisplay = Math.floor((msLeft / 1000) % 60).toString().padStart(2, '0');
    const centiSecondsDisplay = Math.floor((msLeft % 1000) / 10).toString().padStart(2, '0');
    return `${secondsDisplay}:${centiSecondsDisplay}`;
  }

  protected onPupClicked(event: MouseEvent): void {
    event.stopPropagation();

    const slotIndex = this.pupSlot?.slotIndex;
    if (slotIndex === undefined || slotIndex === null) {
      return;
    }

    this.pupSlotClicked.emit(slotIndex);
  }
}
