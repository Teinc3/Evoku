import { Component, HostBinding, Input } from '@angular/core';


@Component({
  selector: 'app-combat-notification-holder',
  standalone: true,
  templateUrl: './combat-notification-holder.component.html',
  styleUrl: './combat-notification-holder.component.scss',
})
export default class CombatNotificationHolderComponent {
  @Input({ required: true })
  public owner!: 'ME' | 'OPPONENT';

  @Input({ required: true })
  public mode!: 'TOP' | 'SIDE';

  @HostBinding('attr.data-owner')
  protected get dataOwner(): 'ME' | 'OPPONENT' {
    return this.owner;
  }

  @HostBinding('attr.data-mode')
  protected get dataMode(): 'TOP' | 'SIDE' {
    return this.mode;
  }
}
