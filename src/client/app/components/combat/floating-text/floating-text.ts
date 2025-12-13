import { Component, Input } from '@angular/core';

import type { CombatOutcomeText } from '../../../../types/combat';


@Component({
  selector: 'app-combat-floating-text',
  standalone: true,
  templateUrl: './floating-text.html',
  styleUrl: './floating-text.scss'
})
export default class CombatFloatingTextComponent {
  @Input()
  public messages: CombatOutcomeText[] = [];

  @Input()
  public currentTimeMs: number | null = null;

  get activeMessages(): CombatOutcomeText[] {
    const now = this.currentTimeMs ?? performance.now();
    return this.messages
      .filter(msg => msg.expiresAtMs > now)
      .sort((a, b) => a.createdAtMs - b.createdAtMs);
  }
}
