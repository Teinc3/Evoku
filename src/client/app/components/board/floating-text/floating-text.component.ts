import {
  Component, signal, type OnDestroy
} from '@angular/core';

import { CombatOutcome } from '../../../../types/enums';

import type { WritableSignal } from '@angular/core';
import type { FloatingText } from '../../../../types/combat';


/** Duration for floating text animation in milliseconds */
const FLOATING_TEXT_DURATION = 2000;


/**
 * FloatingTextComponent renders localized text effects over the board.
 * Text floats upward and fades out after a duration.
 */
@Component({
  selector: 'app-floating-text',
  standalone: true,
  templateUrl: './floating-text.component.html',
  styleUrl: './floating-text.component.scss'
})
export default class FloatingTextComponent implements OnDestroy {
  /** Collection of active floating texts */
  readonly floatingTexts: WritableSignal<FloatingText[]> = signal([]);

  /** Counter for generating unique IDs */
  private nextId = 0;

  /** Map of cleanup timeouts keyed by floating text ID */
  private cleanupTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

  ngOnDestroy(): void {
    // Clear all pending timeouts
    for (const timeout of this.cleanupTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.cleanupTimeouts.clear();
  }

  /**
   * Spawns a new floating text effect.
   * @param text The text to display
   * @param outcome The outcome type (determines color/style)
   */
  spawnText(text: string, outcome: CombatOutcome): void {
    const id = this.nextId++;
    const newText: FloatingText = {
      id,
      text,
      outcome,
      createdAt: Date.now()
    };

    // Add to collection
    this.floatingTexts.update(texts => [...texts, newText]);

    // Schedule removal after animation completes
    const timeout = setTimeout(() => {
      this.removeText(id);
    }, FLOATING_TEXT_DURATION);

    this.cleanupTimeouts.set(id, timeout);
  }

  /**
   * Spawns a "reflected" outcome text (e.g., "REFLECTED!", "SHATTERED!")
   */
  spawnReflected(text: string = 'REFLECTED!'): void {
    this.spawnText(text, CombatOutcome.REFLECTED);
  }

  /**
   * Spawns a "hit" outcome text (e.g., "FROZEN!", "LOCKED!")
   */
  spawnHit(text: string = 'HIT!'): void {
    this.spawnText(text, CombatOutcome.HIT);
  }

  /**
   * Gets the CSS class for a floating text based on its outcome.
   */
  getOutcomeClass(outcome: CombatOutcome): string {
    switch (outcome) {
      case CombatOutcome.REFLECTED:
        return 'outcome-reflected';
      case CombatOutcome.HIT:
        return 'outcome-hit';
      default:
        return '';
    }
  }

  /**
   * Removes a floating text by ID.
   */
  private removeText(id: number): void {
    this.floatingTexts.update(texts => texts.filter(t => t.id !== id));
    this.cleanupTimeouts.delete(id);
  }
}
