import { Component, Input } from '@angular/core';

import type { CombatOutcomeText } from '../../../../types/combat';


@Component({
  selector: 'app-combat-floating-text',
  standalone: true,
  templateUrl: './floating-text.html',
  styleUrl: './floating-text.scss'
})
export default class CombatFloatingTextComponent {
  private _messages: CombatOutcomeText[] = [];
  private _currentTimeMs: number | null = null;
  private cachedActive: CombatOutcomeText[] = [];

  @Input()
  set messages(value: CombatOutcomeText[]) {
    this._messages = value ?? [];
    this.recompute();
  }

  get messages(): CombatOutcomeText[] {
    return this._messages;
  }

  @Input()
  set currentTimeMs(value: number | null) {
    this._currentTimeMs = value;
    this.recompute();
  }

  get currentTimeMs(): number | null {
    return this._currentTimeMs;
  }

  get activeMessages(): CombatOutcomeText[] {
    return this.cachedActive;
  }

  private recompute(): void {
    const current = this._currentTimeMs;
    if (current === null) {
      this.cachedActive = [];
      return;
    }

    this.cachedActive = this._messages
      .filter(msg => msg.expiresAtMs > current)
      .sort((a, b) => a.createdAtMs - b.createdAtMs);
  }
}
