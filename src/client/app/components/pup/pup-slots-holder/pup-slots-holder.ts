import {
  Component, EventEmitter, Input, Output, ViewChildren, type QueryList,
} from '@angular/core';

import PupSlotComponent from '../pup-slot/pup-slot.component';

import type { IPUPSlotState } from '@shared/types/gamestate/powerups';


@Component({
  selector: 'app-pup-slots-holder',
  standalone: true,
  imports: [PupSlotComponent],
  templateUrl: './pup-slots-holder.html',
  styleUrl: './pup-slots-holder.scss'
})
export default class PupSlotsHolderComponent {

  @Input()
  slots?: readonly [IPUPSlotState, IPUPSlotState, IPUPSlotState];

  @Output()
  slotClicked = new EventEmitter<number>();

  @ViewChildren(PupSlotComponent)
  private slotComponents?: QueryList<PupSlotComponent>;

  protected onSlotClicked(slotIndex: number): void {
    this.slotClicked.emit(slotIndex);
  }

  public shakeSlot(slotIndex: number): void {
    const slotComp = this.slotComponents?.find(comp => comp.slot?.slotIndex === slotIndex);
    if (!slotComp) {
      return;
    }

    slotComp.beginShake();
  }

  public glowSlot(slotIndex: number): void {
    const slotComp = this.slotComponents?.find(comp => comp.slot?.slotIndex === slotIndex);
    if (!slotComp) {
      return;
    }

    slotComp.beginGlow();
  }
}
