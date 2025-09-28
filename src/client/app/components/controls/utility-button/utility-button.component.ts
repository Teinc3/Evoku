import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-utility-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './utility-button.component.html',
  styleUrls: ['./utility-button.component.scss'],
})
export default class UtilityButtonComponent {
  @Input() 
  icon: string | undefined;
  @Input() 
  label!: string;
  @Input() 
  disabled = false;
  @Input() 
  active = false; // Allows special styling (e.g., Note mode toggled)
}
