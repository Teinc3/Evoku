import {
  ChangeDetectionStrategy, ChangeDetectorRef, NgZone,
  Component, EventEmitter,
  OnDestroy, OnInit, Output, Input
} from '@angular/core';

import pupConfig from '@config/shared/pup.json';

import type { IPUPSlotState } from '@shared/types/gamestate/powerups';


@Component({
  selector: 'app-combat-notification',
  standalone: true,
  templateUrl: './combat-notification.component.html',
  styleUrl: './combat-notification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CombatNotificationComponent implements OnInit, OnDestroy {
  private static readonly UPDATE_INTERVAL_MS = 10;
  protected pupConfig = pupConfig; // Expose to template

  @Input({ required: true })
  public isOutbound!: boolean;
  @Input({ required: true })
  public defuseObjective!: number;
  @Input({ required: true })
  public pupSlot!: IPUPSlotState;
  @Output()
  public readonly pupSlotClicked: EventEmitter<number>;

  protected timerLabel: string;
  protected msLeft: number;
  private intervalId: number | null;

  constructor(private readonly ngZone: NgZone, private readonly cdRef: ChangeDetectorRef) {
    this.pupSlotClicked = new EventEmitter<number>();
    this.timerLabel = '00:00';
    this.msLeft = 0;
    this.intervalId = null;
  }

  public ngOnInit(): void {
    this.updateTimerLabel();

    this.ngZone.runOutsideAngular(() => {
      this.intervalId = window.setInterval(() => {
        this.updateTimerLabel();
      }, CombatNotificationComponent.UPDATE_INTERVAL_MS);
    });
  }

  public ngOnDestroy(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateTimerLabel(): void {
    const cooldownEnd = this.pupSlot.pendingCooldownEnd ?? this.pupSlot.lastCooldownEnd;
    const msLeft = Math.max(0, cooldownEnd - performance.now());
    this.msLeft = msLeft;

    const secondsDisplay = Math.floor((msLeft / 1000) % 60).toString().padStart(2, '0');
    const centiSecondsDisplay = Math.floor((msLeft % 1000) / 10).toString().padStart(2, '0');
    this.timerLabel = `${secondsDisplay}:${centiSecondsDisplay}`;
    this.cdRef.detectChanges();
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
