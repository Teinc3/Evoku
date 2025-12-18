import { Component, Input, Output, EventEmitter, HostListener, HostBinding } from '@angular/core';

import pupConfig from '@config/shared/pup.json';

import type { PupSlotState } from '../../../../types/pup';


@Component({
  selector: 'app-pup-slot',
  standalone: true,
  templateUrl: './pup-slot.component.html',
  styleUrl: './pup-slot.component.scss'
})
export default class PupSlotComponent {
  /** The slot state containing PUP data */
  @Input()
  slotState: PupSlotState | null = null;

  /** The index of this slot (0-2) */
  @Input()
  slotIndex: number = 0;

  /** Emitted when user clicks to use this PUP */
  @Output()
  usePup = new EventEmitter<number>();

  /** Gets the PUP icon path from config */
  get pupIcon(): string | null {
    if (this.slotState?.pupID === null || this.slotState?.pupID === undefined) {
      return null;
    }
    const config = pupConfig[this.slotState.pupID];
    return config?.asset?.icon ?? null;
  }

  /** Gets the PUP level */
  get level(): number | null {
    return this.slotState?.level ?? null;
  }

  /** Gets the PUP name from config */
  get pupName(): string | null {
    if (this.slotState?.pupID === null || this.slotState?.pupID === undefined) {
      return null;
    }
    const config = pupConfig[this.slotState.pupID];
    return config?.name ?? null;
  }

  /** Whether this slot has a PUP equipped */
  get isOccupied(): boolean {
    return this.slotState?.pupID !== null && this.slotState?.pupID !== undefined;
  }

  /** Whether this PUP is on cooldown */
  get isOnCooldown(): boolean {
    return this.slotState?.onCooldown ?? false;
  }

  /** Whether this PUP can be used */
  get canUse(): boolean {
    return this.isOccupied && !this.isOnCooldown;
  }

  @HostBinding('class.occupied')
  get hostOccupied(): boolean {
    return this.isOccupied;
  }

  @HostBinding('class.cooldown')
  get hostCooldown(): boolean {
    return this.isOnCooldown;
  }

  @HostBinding('class.usable')
  get hostUsable(): boolean {
    return this.canUse;
  }

  @HostListener('click')
  onClick(): void {
    if (this.canUse) {
      this.usePup.emit(this.slotIndex);
    }
  }
}
