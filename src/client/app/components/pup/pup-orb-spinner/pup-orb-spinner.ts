import { Component, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';

import PUPOrbState from '../../../../types/enums/pup-orb-state.enum';


@Component({
  selector: 'app-pup-orb-spinner',
  standalone: true,
  templateUrl: './pup-orb-spinner.html',
  styleUrl: './pup-orb-spinner.scss'
})
export default class PupOrbSpinnerComponent {
  // Change to input in the future when wiring everything up
  state: PUPOrbState = PUPOrbState.IDLE;
  @Input() 
  disabled = false;

  @Output() 
  roll = new EventEmitter<void>();

  public PUPOrbState = PUPOrbState;

  @HostBinding('attr.role') 
  role = 'button';
  @HostBinding('attr.tabindex') 
  tabindex = 0;
  @HostBinding('attr.aria-busy') 
  get ariaBusy(): string {
    return String(this.state === PUPOrbState.SPINNING);
  }
  @HostBinding('class.ready') 
  get isReady(): boolean {
    return this.state === PUPOrbState.READY;
  }
  @HostBinding('class.spinning') 
  get isSpinning(): boolean {
    return this.state === PUPOrbState.SPINNING;
  }

  @HostListener('click') 
  onClick(): void {
    if (this.disabled) { 
      return;
    }
    // Testing cycle: IDLE -> READY -> SPINNING -> IDLE
    switch (this.state) {
      case PUPOrbState.IDLE:
        this.state = PUPOrbState.READY;
        break;
      case PUPOrbState.READY:
        this.state = PUPOrbState.SPINNING;
        this.roll.emit();
        break;
      case PUPOrbState.SPINNING:
        this.state = PUPOrbState.IDLE;
        break;
    }
  }
}

