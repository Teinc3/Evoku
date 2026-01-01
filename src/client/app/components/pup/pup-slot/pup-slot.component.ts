import {
  Component, DoCheck, EventEmitter, HostBinding, Input, Output, type OnDestroy,
} from '@angular/core';

import pupConfig from '@config/shared/pup.json';
import CooldownAnimationHelper from '../../../utils/cooldown-animation-helper';

import type { IPUPSlotState } from '@shared/types/gamestate/powerups';


@Component({
  selector: 'app-pup-slot',
  standalone: true,
  templateUrl: './pup-slot.component.html',
  styleUrl: './pup-slot.component.scss'
})
export default class PupSlotComponent implements DoCheck, OnDestroy {
  @Input()
  slot: IPUPSlotState | null;
  @Output()
  slotClicked: EventEmitter<number>;

  private static readonly SHAKE_MS = 350;
  public readonly countdownHelper: CooldownAnimationHelper;
  private shakeTimeoutId: number | null;
  private isShaking: boolean;

  constructor() {
    this.slot = null;
    this.slotClicked = new EventEmitter<number>();
    this.countdownHelper = new CooldownAnimationHelper();
    this.shakeTimeoutId = null;
    this.isShaking = false;
  }

  ngDoCheck(): void {
    const pendingEnd = this.slot?.pendingCooldownEnd;
    const normalEnd = this.slot?.lastCooldownEnd;

    this.countdownHelper.checkCooldownChanges(
      pendingEnd !== undefined && normalEnd !== undefined && pendingEnd > normalEnd
        ? pendingEnd
        : undefined,
      normalEnd
    );
  }

  ngOnDestroy(): void {
    this.countdownHelper.reset();

    if (this.shakeTimeoutId !== null) {
      clearTimeout(this.shakeTimeoutId);
      this.shakeTimeoutId = null;
    }
  }

  @HostBinding('class.shake')
  get shakeClass(): boolean {
    return this.isShaking;
  }

  public beginShake(): void {
    this.isShaking = true;

    if (this.shakeTimeoutId !== null) {
      clearTimeout(this.shakeTimeoutId);
    }

    this.shakeTimeoutId = window.setTimeout(() => {
      this.isShaking = false;
      this.shakeTimeoutId = null;
    }, PupSlotComponent.SHAKE_MS);
  }

  protected onClick(): void {
    const slotIndex = this.slot?.slotIndex;
    if (slotIndex === undefined || slotIndex === null) {
      return;
    }

    this.slotClicked.emit(slotIndex);
  }

  protected get slotIcon(): string | null {
    const slotIndex = this.slot?.slotIndex;
    if (slotIndex === undefined || slotIndex === null) {
      return null;
    }

    if (slotIndex === 2) {
      return '/assets/slots/icons/box-diffuse.svg';
    }

    return '/assets/slots/icons/diffuse.svg';
  }

  protected get isColumnIcon(): boolean {
    return this.slot?.slotIndex === 1;
  }

  protected get isBoxIcon(): boolean {
    return this.slot?.slotIndex === 2;
  }

  protected get pupIcon(): string | null {
    const pup = this.slot?.pup;
    if (!pup) {
      return null;
    }
    const configEntry = pupConfig.find(entry => entry.type === pup.type);
    return configEntry ? configEntry.asset.icon : null;
  }

  protected get level(): number | null {
    const pup = this.slot?.pup;
    return pup ? pup.level : null;
  }
}
