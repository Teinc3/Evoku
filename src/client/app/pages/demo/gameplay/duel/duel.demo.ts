import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';

import ViewStateService from '../../../../services/view-state';
import NetworkService from '../../../../services/network';
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
import { AppView } from '../../../../../types/enums';
import GameStateModel from '../../../../../models/GameState';

import type { MatchFoundContract } from '@shared/types/contracts';


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
export default class DuelDemoPageComponent implements OnInit, OnDestroy {
  private matchState: GameStateModel;
  private disconnectionSubscription: Subscription | null = null;

  constructor(
    private viewStateService: ViewStateService,
    private networkService: NetworkService
  ) {
    this.matchState = new GameStateModel();
  }

  ngOnInit(): void {
    // Load match data from navigation and transfer to our owned model
    const matchData = this.viewStateService.getNavigationData<MatchFoundContract>();
    if (matchData) {
      this.matchState.setMatchData(matchData);
    }

    // Subscribe to disconnection events
    this.disconnectionSubscription = this.networkService.onDisconnect().subscribe(() => {
      // Navigate back to catalogue on disconnect
      this.viewStateService.navigateToView(AppView.CATALOGUE);
    });
  }

  ngOnDestroy(): void {
    // Clear our local match state
    this.matchState.clearMatchData();

    if (this.disconnectionSubscription) {
      this.disconnectionSubscription.unsubscribe();
      this.disconnectionSubscription = null;
    }
  }

  /**
   * Get the game state model for HUD components
   */
  get gameState(): GameStateModel {
    return this.matchState;
  }
}
