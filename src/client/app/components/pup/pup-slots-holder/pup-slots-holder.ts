import { Component, Input, Output, EventEmitter, inject } from '@angular/core';

import PupSlotComponent from '../pup-slot/pup-slot.component';
import PupStateService from '../../../services/pup-state';

import type { PupSlotState } from '../../../../types/pup';


@Component({
  selector: 'app-pup-slots-holder',
  standalone: true,
  imports: [PupSlotComponent],
  templateUrl: './pup-slots-holder.html',
  styleUrl: './pup-slots-holder.scss'
})
export default class PupSlotsHolderComponent {
  private readonly pupStateService = inject(PupStateService);

  /** Whether to use external slots data instead of service */
  @Input()
  externalSlots: PupSlotState[] | null = null;

  /** Emitted when user clicks to use a PUP */
  @Output()
  usePup = new EventEmitter<{ slotIndex: number; pupID: number }>();

  /** Gets the slots to display */
  get slots(): PupSlotState[] {
    return this.externalSlots ?? this.pupStateService.slots();
  }

  /** Handles PUP use from a slot */
  onUsePup(slotIndex: number): void {
    const slot = this.slots[slotIndex];
    if (slot?.pupID !== null && slot?.pupID !== undefined) {
      this.usePup.emit({ slotIndex, pupID: slot.pupID });
    }
  }
}
