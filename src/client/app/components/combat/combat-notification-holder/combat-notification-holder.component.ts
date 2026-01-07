import { Component, HostBinding, Input } from '@angular/core';


@Component({
  selector: 'app-combat-notification-holder',
  standalone: true,
  templateUrl: './combat-notification-holder.component.html',
  styleUrl: './combat-notification-holder.component.scss',
})
export default class CombatNotificationHolderComponent {
  @Input({ required: true })
  @HostBinding('attr.data-is-mine')
  public isMine!: boolean;
  @Input({ required: true })
  @HostBinding('attr.data-is-side')
  public isSide!: boolean;
}
