import { Component } from '@angular/core';

import PupSlotsHolderComponent from '../../../../components/pup/pup-slots-holder/pup-slots-holder';
import PupOrbSpinnerComponent from '../../../../components/pup/pup-orb-spinner/pup-orb-spinner';
import UniversalProgressBarComponent 
  from '../../../../components/hud/universal-progress-bar/universal-progress-bar.component';
import DuelHudTopComponent from '../../../../components/hud/duel-hud-top/duel-hud-top';
import UtilityButtonsHolderComponent 
  from '../../../../components/controls/utility-buttons-holder/utility-buttons-holder.component';
import NumericButtonsHolderComponent 
  from '../../../../components/controls/numeric-buttons-holder/numeric-buttons-holder.component';
import BoardModelComponent from '../../../../components/board/board.component';
import MatchmakingService from '../../../../services/matchmaking.service';


@Component({
  selector: 'app-demo-duel',
  standalone: true,
  imports: [
    DuelHudTopComponent, 
    BoardModelComponent, 
    UniversalProgressBarComponent, 
    UtilityButtonsHolderComponent, 
    NumericButtonsHolderComponent,
    PupSlotsHolderComponent,
    PupOrbSpinnerComponent
  ],
  templateUrl: './duel.demo.html',
  styleUrl: './duel.demo.scss'
})
export default class DuelDemoPageComponent {
  constructor(protected readonly matchmakingService: MatchmakingService) {}

  /**
   * Get the player's username
   */
  get myUsername(): string {
    const myInfo = this.matchmakingService.getMyInfo();
    return myInfo?.username ?? 'Player 1';
  }

  /**
   * Get the opponent's username
   */
  get opponentUsername(): string {
    const opponent = this.matchmakingService.getOpponent();
    return opponent?.username ?? 'Player 2';
  }

  /**
   * Get the player's ID
   */
  get myPlayerID(): number {
    return this.matchmakingService.myPlayerID() ?? 0;
  }

  /**
   * Get the opponent's ID
   */
  get opponentPlayerID(): number {
    const opponent = this.matchmakingService.getOpponent();
    return opponent?.playerID ?? 1;
  }
}
