import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-combat-notification',
  standalone: true,
  templateUrl: './combat-notification.component.html',
  styleUrl: './combat-notification.component.scss',
})
export default class CombatNotificationComponent {
  @Input({ required: true })
  public isOutbound!: boolean;
  @Input({ required: true })
  public secondsLeft!: number;
  @Input({ required: true })
  public defuseObjective!: number;
  /** Placeholder name for now; will be wired to real PUP later. */
  @Input({ required: true })
  public pupLabel!: string;

  protected get timerLabel(): string {
    const safeSeconds = Math.max(0, Math.floor(this.secondsLeft));
    return `${safeSeconds}s`;
  }
}
