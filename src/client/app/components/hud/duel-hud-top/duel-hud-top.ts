import { Input, Component } from '@angular/core';

import UniversalProgressBarComponent
  from '../universal-progress-bar/universal-progress-bar.component';
import PhaseTimerComponent from '../phase-timer/phase-timer.component';


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
  player1Username: string = 'Player 1';
  @Input()
  player1ID: number = 0;
  @Input()
  player2Username: string = 'Player 2';
  @Input()
  player2ID: number = 1;
}
