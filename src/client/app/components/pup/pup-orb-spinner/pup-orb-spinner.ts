import {
  Component, EventEmitter, HostBinding, HostListener, Input, Output, inject
} from '@angular/core';

import PupStateService from '../../../services/pup-state';
import { PUPOrbState } from '../../../../types/enums';


@Component({
  selector: 'app-pup-orb-spinner',
  standalone: true,
  templateUrl: './pup-orb-spinner.html',
  styleUrl: './pup-orb-spinner.scss'
})
export default class PupOrbSpinnerComponent {
  private readonly pupStateService = inject(PupStateService);

  @Input() 
  disabled = false;

  @Output() 
  roll = new EventEmitter<void>();

  public PUPOrbState = PUPOrbState;

  /** Gets current orb state from service */
  get state(): PUPOrbState {
    return this.pupStateService.orbState();
  }

  @HostBinding('attr.role') 
  role = 'button';
  @HostBinding('attr.tabindex') 
  tabindex = 0;
  @HostBinding('attr.aria-busy') 
  get ariaBusy(): string {
    return String(this.state === PUPOrbState.SPINNING);
  }
  @HostBinding('class.idle')
  get isIdle(): boolean {
    return this.state === PUPOrbState.IDLE;
  }
  @HostBinding('class.ready') 
  get isReady(): boolean {
    return this.state === PUPOrbState.READY;
  }
  @HostBinding('class.spinning') 
  get isSpinning(): boolean {
    return this.state === PUPOrbState.SPINNING;
  }
  @HostBinding('class.disabled')
  get isDisabled(): boolean {
    return this.disabled || this.pupStateService.allSlotsOccupied();
  }

  @HostListener('click') 
  onClick(): void {
    if (this.disabled || this.pupStateService.allSlotsOccupied()) { 
      return;
    }

    // Only emit roll when in READY state
    if (this.state === PUPOrbState.READY) {
      this.roll.emit();
    }
  }
}

