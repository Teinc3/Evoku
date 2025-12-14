import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import type { PupSlotState } from '../../../../types/pup';


@Component({
  selector: 'app-pup-slot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pup-slot.component.html',
  styleUrl: './pup-slot.component.scss'
})
export default class PupSlotComponent {
  @Input()
  pup: PupSlotState | null = null;

  @Input()
  disabled = false;

  @Input()
  showName = true;

  @Output()
  use = new EventEmitter<void>();

  onUse(): void {
    if (this.disabled || !this.pup || this.pup.status !== 'ready') {
      return;
    }
    this.use.emit();
  }
}
