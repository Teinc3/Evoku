import { Component, Input } from '@angular/core';

import pupConfig from '@config/shared/pup.json';

import type { IPUPSlotState } from '@shared/types/gamestate/powerups';


@Component({
  selector: 'app-pup-slot',
  standalone: true,
  templateUrl: './pup-slot.component.html',
  styleUrl: './pup-slot.component.scss'
})
export default class PupSlotComponent {
  @Input()
  slot: IPUPSlotState | null = null;

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
