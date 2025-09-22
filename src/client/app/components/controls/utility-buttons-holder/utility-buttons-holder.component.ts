import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import UtilityButtonComponent from '../utility-button/utility-button.component';
import UtilityAction from '../../../../types/utility';


@Component({
  selector: 'app-utility-buttons-holder',
  standalone: true,
  imports: [CommonModule, UtilityButtonComponent],
  templateUrl: './utility-buttons-holder.component.html',
  styleUrls: ['./utility-buttons-holder.component.scss'],
})
export default class UtilityButtonsHolderComponent {
  @Output() action = new EventEmitter<UtilityAction>();

  protected readonly UtilityAction = UtilityAction;
  protected readonly buttons = [
    { action: UtilityAction.UNDO, icon: 'undo', label: 'Undo', disabled: true },
    {
      action: UtilityAction.CLEAR,
      icon: 'clear',
      label: 'Clear',
      disabled: false,
    },
    { action: UtilityAction.NOTE, icon: 'edit', label: 'Note', disabled: false },
    {
      action: UtilityAction.SETTINGS,
      icon: 'settings',
      label: 'Settings',
      disabled: true,
    },
    {
      action: UtilityAction.QUIT,
      icon: 'logout',
      label: 'Quit',
      disabled: false,
    },
  ];

  onAction(action: UtilityAction) {
    this.action.emit(action);
  }
}
