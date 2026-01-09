import { Subscription } from 'rxjs';
import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  signal,
} from '@angular/core';

import ViewStateService from '../../../../services/view-state';
import NetworkService from '../../../../services/network';
import PupSpinnerComponent 
  from '../../../../components/pup/pup-spinner/pup-spinner';
import PupSlotsHolderComponent 
  from '../../../../components/pup/pup-slots-holder/pup-slots-holder';
import UniversalProgressBarComponent 
  from '../../../../components/hud/universal-progress-bar/universal-progress-bar.component';
import DuelHudTopComponent from '../../../../components/hud/duel-hud-top/duel-hud-top';
import UtilityButtonsHolderComponent 
  from '../../../../components/controls/utility-buttons-holder/utility-buttons-holder.component';
import NumericButtonsHolderComponent 
  from '../../../../components/controls/numeric-buttons-holder/numeric-buttons-holder.component';
import CombatNotificationHolderComponent
  from
  '../../../../components/combat/combat-notification-holder/combat-notification-holder.component';
import CombatNotificationComponent
  from '../../../../components/combat/combat-notification/combat-notification.component';
import BoardModelComponent from '../../../../components/board/board.component';
import { AppView } from '../../../../../types/enums';
import { DuelActionDispatcher, DuelActionListener } from '../../../../../game/handlers';
import GameStateManager from '../../../../../game/GameStateManager';

import type { ISlotEffect } from '@shared/types/gamestate/powerups';
import type { MatchFoundContract } from '@shared/types/contracts';


@Component({
  selector: 'app-demo-duel',
  standalone: true,
  providers: [DuelActionDispatcher, DuelActionListener],
  imports: [
    DuelHudTopComponent, 
    BoardModelComponent, 
    UniversalProgressBarComponent, 
    UtilityButtonsHolderComponent, 
    NumericButtonsHolderComponent,
    PupSlotsHolderComponent,
    PupSpinnerComponent,
    CombatNotificationComponent,
    CombatNotificationHolderComponent,
  ],
  templateUrl: './duel.demo.html',
  styleUrl: './duel.demo.scss'
})
export default class DuelDemoPageComponent implements OnInit, OnDestroy, AfterViewInit {
  static readonly MAX_PLAYER_COUNT = 2;
  private static readonly COMBAT_SIDE_MODE_ENTER_RATIO = 2.1;
  private static readonly COMBAT_SIDE_MODE_EXIT_RATIO = 2;
  public readonly gameState: GameStateManager;
  private readonly subscriptions: Subscription;
  protected AppView = AppView;
  protected performance = performance;

  protected get incomingThreat(): { effect: ISlotEffect; defuseObjective: number } | null {
    const enemyID = 1 - this.gameState.myID;
    const slots = this.gameState.getPlayerState(enemyID).gameState?.powerups;
    if (!slots) {
      return null;
    }

    for (const slot of slots) {
      const effect = slot.pup?.pendingEffect;
      if (effect) {
        return { effect, defuseObjective: slot.slotIndex };
      }
    }

    return null;
  }

  @ViewChild('board1')
  board1!: BoardModelComponent;
  @ViewChild('board2')
  board2!: BoardModelComponent;
  @ViewChild('pupSpinner')
  pupSpinner?: PupSpinnerComponent;
  @ViewChild('myPupSlots')
  myPupSlots?: PupSlotsHolderComponent;

  protected readonly isCombatSideMode = signal<boolean>(false);

  private isViewportListenerBound = false;

  constructor(
    protected viewStateService: ViewStateService,
    protected readonly duelActionDispatcher: DuelActionDispatcher,
    protected readonly duelActionListener: DuelActionListener,
    private readonly networkService: NetworkService
  ) {
    this.gameState = new GameStateManager(DuelDemoPageComponent.MAX_PLAYER_COUNT);
    this.subscriptions = new Subscription();
    this.duelActionDispatcher.gameInit(this.gameState);
    this.duelActionListener.gameInit(this.gameState);
  }

  ngAfterViewInit(): void {
    this.duelActionDispatcher.setAccessContexts(
      {
        selected: () => this.board1.selected(),
        getCellValue: (cellIndex: number) => this.board1.model.board[cellIndex]?.value ?? null
      },
      {
        selected: () => this.board2.selected(),
        getCellValue: (cellIndex: number) => this.board2.model.board[cellIndex]?.value ?? null
      },
      (slotIndex: number) => this.myPupSlots?.shakeSlot(slotIndex)
    );

    this.duelActionListener.setContext({
      onDisconnect: () => this.onQuit(),
      onCellRejection: (cellIndex: number, value: number) => {
        this.board1.handleCellRejection(cellIndex, value);
      },
      onBeginPupSettling: () => this.pupSpinner?.beginSettling(),
      onSetPupSettlingType: element => this.pupSpinner?.setSettlingType(element)
    });

    this.bindViewportModeListener();
  }

  ngOnInit(): void {
    // Load match data from navigation and transfer to our owned model
    const matchData = this.viewStateService.getNavigationData<MatchFoundContract>();
    if (matchData) {
      this.gameState.createGame(matchData);
    }

    this.subscriptions.add(this.duelActionListener.bind());
  }

  ngOnDestroy(): void {
    this.gameState.clearMatchData();
    this.networkService.disconnect();
    this.subscriptions.unsubscribe();

    if (this.isViewportListenerBound) {
      window.removeEventListener('resize', this.onViewportResize);
      this.isViewportListenerBound = false;
    }
  }

  /** Handle quit action: disconnect and navigate to catalogue */
  onQuit(): void {
    this.networkService.disconnect();
    this.viewStateService.navigateToView(AppView.CATALOGUE);
  }

  /** Handle selection changes to ensure only one board has a cursor */
  onBoardSelectionChanged(boardIndex: number): void {
    if (boardIndex === 0) {
      this.board2.selected.set(null);
    } else if (boardIndex === 1) {
      this.board1.selected.set(null);
    }
  }

  private bindViewportModeListener(): void {
    if (this.isViewportListenerBound) {
      return;
    }

    this.isViewportListenerBound = true;
    window.addEventListener('resize', this.onViewportResize);
    this.recalculateCombatModeFromViewport();
  }

  private readonly onViewportResize = (): void => {
    this.recalculateCombatModeFromViewport();
  };

  private recalculateCombatModeFromViewport(): void {
    const width = window.innerWidth;
    const height = Math.max(1, window.innerHeight);
    const viewportRatio = width / height;
    const currentSideMode = this.isCombatSideMode();

    let nextSideMode = currentSideMode;
    if (currentSideMode) {
      nextSideMode = viewportRatio >= DuelDemoPageComponent.COMBAT_SIDE_MODE_EXIT_RATIO;
    } else {
      nextSideMode = viewportRatio >= DuelDemoPageComponent.COMBAT_SIDE_MODE_ENTER_RATIO;
    }

    if (nextSideMode !== currentSideMode) {
      this.isCombatSideMode.set(nextSideMode);
    }
  }
}
