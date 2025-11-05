import { Input, Component } from '@angular/core';

import UniversalProgressBarComponent
  from '../universal-progress-bar/universal-progress-bar.component';
import PhaseTimerComponent from '../phase-timer/phase-timer.component';
import GameStateModel from '../../../../models/GameState';


@Component({
  selector: 'app-duel-hud-top',
  standalone: true,
  imports: [UniversalProgressBarComponent, PhaseTimerComponent],
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
  gameState!: GameStateModel;

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
