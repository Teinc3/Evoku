import { Component, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';

import { PUPOrbState } from '../../../../types/enums';


@Component({
  selector: 'app-pup-orb-spinner',
  standalone: true,
  templateUrl: './pup-orb-spinner.html',
  styleUrl: './pup-orb-spinner.scss'
})
export default class PupOrbSpinnerComponent {
  @Input()
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
  @HostBinding('class.equipped')
  get isEquipped(): boolean {
    return this.state === PUPOrbState.EQUIPPED;
  }

  @HostListener('click') 
  onClick(): void {
    if (this.disabled || this.state !== PUPOrbState.READY) { 
      return;
    }
    this.state = PUPOrbState.SPINNING;
    this.roll.emit();
  }
}

