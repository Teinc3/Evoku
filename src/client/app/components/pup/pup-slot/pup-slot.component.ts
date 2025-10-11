import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-pup-slot',
  standalone: true,
  templateUrl: './pup-slot.component.html',
  styleUrl: './pup-slot.component.scss'
})
export default class PupSlotComponent {
  @Input() locked = false;
  @Input() pending = false;
  @Input() level: number | null = null;
}
