import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import UtilityButtonComponent from '../utility-button/utility-button.component';
import UtilityAction from '../../../../types/utility';


@Component({
  selector: 'app-utility-buttons-holder',
  standalone: true,
  imports: [CommonModule, UtilityButtonComponent],
  templateUrl: './utility-buttons-holder.component.html',
  styleUrl: './utility-buttons-holder.component.scss',
})
export default class UtilityButtonsHolderComponent {
  // Indicates if note mode currently active (to highlight Note button)
  @Input()
  noteModeActive = false;
  @Output()
  protected utilityClick = new EventEmitter<UtilityAction>();
  @Output()
  protected quitClick = new EventEmitter<void>();

  protected readonly UtilityAction = UtilityAction;
  protected readonly buttons = [
    {
      action: UtilityAction.CLEAR,
      icon: 'clear',
      label: 'Clear',
      disabled: false,
    },
    { action: UtilityAction.NOTE, icon: 'edit', label: 'Note', disabled: false },
    {
      action: UtilityAction.QUIT,
      icon: 'logout',
      label: 'Quit',
      disabled: false,
    },
  ];

  onUtilityAction(action: UtilityAction) {
    if (action === UtilityAction.QUIT) {
      this.quitClick.emit();      
    } else {
      this.utilityClick.emit(action);
    }
  }
}
