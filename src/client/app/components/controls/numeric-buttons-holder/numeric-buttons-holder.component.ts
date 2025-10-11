import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import NumericButtonComponent from '../numeric-button/numeric-button.component';


@Component({
  selector: 'app-numeric-buttons-holder',
  standalone: true,
  imports: [CommonModule, NumericButtonComponent],
  templateUrl: './numeric-buttons-holder.component.html',
  styleUrl: './numeric-buttons-holder.component.scss',
})
export default class NumericButtonsHolderComponent {
  @Output()
  numberClick = new EventEmitter<number>();

  protected readonly numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  onNumberClick(number: number) {
    this.numberClick.emit(number);
  }
}
