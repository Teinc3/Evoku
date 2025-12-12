import { Input, Component } from '@angular/core';

import UniversalProgressBarComponent
  from '../universal-progress-bar/universal-progress-bar.component';
import PhaseTimerComponent from '../phase-timer/phase-timer.component';
import CombatBadgeComponent from '../combat-badge/combat-badge.component';
import GameStateManager from '../../../../game/GameStateManager';

import type { ThreatData } from '../../../types/combat';


@Component({
  selector: 'app-duel-hud-top',
  standalone: true,
  imports: [UniversalProgressBarComponent, PhaseTimerComponent, CombatBadgeComponent],
  templateUrl: './duel-hud-top.html',
  styleUrl: './duel-hud-top.scss'
})
export default class DuelHudTopComponent {
  @Input()
  boardProgress1: number = 0;
  @Input()
  boardProgress2: number = 0;
  @Input()
  phaseTimeMs: number = 0;
  @Input()
  phase: number = 0;
  @Input()
  gameState!: GameStateManager;
  @Input()
  myThreat: ThreatData | null = null;
  @Input()
  opponentThreat: ThreatData | null = null;

  public Math = Math;

  /**
   * Get the current player's display information
   */
  get myDisplayInfo(): string {
    const info = this.gameState.getPlayerInfo(this.gameState.myID);
    return info.username ? info.username + ' (You)' : 'You';
  }

  /**
   * Get the opponent player's display information
   */
  get opponentDisplayInfo(): string {
    // For 2-player games, opponent is the other player
    const opponentID = 1 - this.gameState.myID;
    const info = this.gameState.getPlayerInfo(opponentID);
    return info.username || 'Opponent';
  }
}
