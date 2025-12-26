import { Component, Input } from '@angular/core';

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
}
