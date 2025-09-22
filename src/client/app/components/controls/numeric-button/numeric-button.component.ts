import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-numeric-button',
  standalone: true,
  templateUrl: './numeric-button.component.html',
  styleUrls: ['./numeric-button.component.scss'],
})
export default class NumericButtonComponent {
  @Input() number = 0;
}
