import { Component } from '@angular/core';

import PupSlotComponent from '../pup-slot/pup-slot.component';


@Component({
  selector: 'app-pup-slots-holder',
  standalone: true,
  imports: [PupSlotComponent],
  templateUrl: './pup-slots-holder.html',
  styleUrl: './pup-slots-holder.scss'
})
export default class PupSlotsHolderComponent {
}
