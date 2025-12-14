import { Component, EventEmitter, Input, Output } from '@angular/core';

import PupSlotComponent from '../pup-slot/pup-slot.component';


import type { PupSlotState } from '../../../../types/pup';


@Component({
  selector: 'app-pup-slots-holder',
  standalone: true,
  imports: [PupSlotComponent],
  templateUrl: './pup-slots-holder.html',
  styleUrl: './pup-slots-holder.scss'
})
export default class PupSlotsHolderComponent {
  @Input()
  slots: PupSlotState[] = [];

  @Input()
  disabled = false;

  @Input()
  showNames = true;

  @Output()
  usePup = new EventEmitter<number>();

  onUse(index: number): void {
    this.usePup.emit(index);
  }
}
