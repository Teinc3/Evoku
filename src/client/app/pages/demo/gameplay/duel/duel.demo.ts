import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import ActionGuard from '@shared/types/utils/typeguards/actions';
import MatchStatus from '@shared/types/enums/matchstatus';
import {
  MechanicsActions, LifecycleActions, ProtocolActions, type PlayerActions,
  WaterPUPActions,
  FirePUPActions,
  WoodPUPActions,
  MetalPUPActions,
  EarthPUPActions
} from '@shared/types/enums/actions';
import pupConfig from '@config/shared/pup.json';
import ViewStateService from '../../../../services/view-state';
import NetworkService from '../../../../services/network';
import PupSlotsHolderComponent 
  from '../../../../components/pup/pup-slots-holder/pup-slots-holder';
import PupOrbSpinnerComponent 
  from '../../../../components/pup/pup-orb-spinner/pup-orb-spinner';
import UniversalProgressBarComponent 
  from '../../../../components/hud/universal-progress-bar/universal-progress-bar.component';
import DuelHudTopComponent from '../../../../components/hud/duel-hud-top/duel-hud-top';
import UtilityButtonsHolderComponent 
  from '../../../../components/controls/utility-buttons-holder/utility-buttons-holder.component';
import NumericButtonsHolderComponent 
  from '../../../../components/controls/numeric-buttons-holder/numeric-buttons-holder.component';
import BoardModelComponent from '../../../../components/board/board.component';
import { AppView } from '../../../../../types/enums';
import { PUPOrbState } from '../../../../../types/enums';
import GameStateManager from '../../../../../game/GameStateManager';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { MatchFoundContract } from '@shared/types/contracts';
import type { PupSlotState } from '../../../../../types/pup';
import type { OmitBaseAttrs } from '../../../../../types/OmitAttrs';


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
  static readonly MAX_PLAYER_COUNT = 2;
  private static readonly MAX_PUP_SLOTS = 3;
  private static readonly PUP_COOLDOWN_MS = 5000;
  public readonly gameState: GameStateManager;
  private subscriptions = new Subscription();
  private nextActionId = 0;
  private cooldownIntervals = new Map<number, number>();
  public orbState: PUPOrbState = PUPOrbState.IDLE;
  public orbDisabled = true;
  public myPupSlots: PupSlotState[] = DuelDemoPageComponent.createEmptySlots();
  public opponentPupSlots: PupSlotState[] = DuelDemoPageComponent.createEmptySlots();
  private rollingActionId: number | null = null;

  @ViewChild('board1') board1!: BoardModelComponent;
  @ViewChild('board2') board2!: BoardModelComponent;

  constructor(
    private viewStateService: ViewStateService,
    private networkService: NetworkService
  ) {
    this.gameState = new GameStateManager(DuelDemoPageComponent.MAX_PLAYER_COUNT);
  }

  private static createEmptySlots(): PupSlotState[] {
    return Array.from({ length: DuelDemoPageComponent.MAX_PUP_SLOTS }, () => ({
      pupID: null,
      name: null,
      icon: null,
      status: 'empty'
    }));
  }

  ngOnInit(): void {
    // Load match data from navigation and transfer to our owned model
    const matchData = this.viewStateService.getNavigationData<MatchFoundContract>();
    if (matchData) {
      this.gameState.createGame(matchData);
    }

    // Subscribe to disconnection events
    this.subscriptions.add(this.networkService.onDisconnect().subscribe(() => {
      // Navigate back to catalogue on disconnect
      this.viewStateService.navigateToView(AppView.CATALOGUE);
    }));

    // Subscribe to game initialization events
    this.subscriptions.add(this.networkService.onPacket(LifecycleActions.GAME_INIT)
      .subscribe(data => {
        // Initialize game states with the board data from server
        this.gameState.initGameStates(data.cellValues);
        this.gameState.timeCoordinator.onGameInit();
        this.gameState.matchState.status = MatchStatus.ONGOING;
      })
    );

    this.subscriptions.add(this.networkService.onPacket(LifecycleActions.GAME_OVER)
      .subscribe(async _data => {
        this.gameState.matchState.status = MatchStatus.ENDED;
      })
    );

    // Subscribe to phase transition events
    this.subscriptions.add(this.networkService.onPacket(LifecycleActions.PHASE_TRANSITION)
      .subscribe(data => {
        this.gameState.matchState.phase = data.newPhase;
      })
    );

    // Subscribe to board progress updates
    this.subscriptions.add(this.networkService.onPacket(ProtocolActions.UPDATE_PROGRESS)
      .subscribe(data => {
        const playerGameState = this.gameState.getPlayerState(data.playerID).gameState;
        if (!playerGameState) {
          return;
        }

        if (data.isBoard) {
          const playerBoardModel = playerGameState.boardState;
          playerBoardModel.progress = data.progress;
        } else {
          playerGameState.pupProgress = data.progress;
          if (data.playerID === this.gameState.myID) {
            this.refreshOrbState();
          }
        }
      })
    );

    this.subscriptions.add(this.networkService.onPacket(MechanicsActions.PUP_DRAWN)
      .subscribe(data => {
        this.gameState.pendingActions.delete(data.actionID);
        this.handlePupDrawn(data.playerID, data.pupID);

        if (data.playerID === this.gameState.myID) {
          this.rollingActionId = null;
          this.refreshOrbState(PUPOrbState.EQUIPPED);
          setTimeout(() => this.refreshOrbState(), 350);
        }
      })
    );

    // Subscribe to cell set confirmations
    this.subscriptions.add(this.networkService.onPacket(MechanicsActions.CELL_SET)
      .subscribe(data => {
        // Confirm the cell placement
        const board = this.gameState.getPlayerBoard(data.playerID);
        if (board) {
          // Check if this is our own pending action confirmed
          let clientTime: number;
          const pendingAction = (data.playerID === this.gameState.myID)
            ? this.gameState.pendingActions.get(data.actionID)
            : undefined;

          if (pendingAction) {
            clientTime = pendingAction.clientTime;
            this.gameState.pendingActions.delete(data.actionID);
          } else {
            clientTime = this.gameState.timeCoordinator.estimateClientTime(data.serverTime);
          }
          board.confirmCellSet(data.cellIndex, data.value, clientTime);
        }
      })
    );

    // Subscribe to action rejections
    this.subscriptions.add(this.networkService.onPacket(ProtocolActions.REJECT_ACTION)
      .subscribe(data => {
        // Reject the pending action - REJECT_ACTION is sent to the client who sent the action
        const pendingAction = this.gameState.pendingActions.get(data.actionID);
        if (pendingAction) {
          this.gameState.pendingActions.delete(data.actionID);
          const board = this.gameState.getPlayerBoard(this.gameState.myID);
          if (board) {
            // TODO: Handle rejection for different action types
            // For now, just reject the cell set
            if (ActionGuard.isActionContract(MechanicsActions.SET_CELL, pendingAction)) {
              this.board1.handleCellRejection(pendingAction.cellIndex, pendingAction.value);
            }
          }
        }
      })
    );

    // Subscribe to ping packets for time synchronization
    this.subscriptions.add(this.networkService.onPacket(ProtocolActions.PING)
      .subscribe(data => {
        // Handle ping and send pong response
        this.gameState.handlePing(data, (action, pongData) => {
          this.networkService.send(action, pongData);
        });
      })
    );
  }

  ngOnDestroy(): void {
    // Clear our local match state
    this.gameState.clearMatchData();
    this.subscriptions.unsubscribe();
    this.clearCooldownIntervals();
  }

  /** Handle packet requests from board components */
  onPacketRequest(request: OmitBaseAttrs<AugmentAction<PlayerActions>>): void {
    this.sendPlayerAction(request);
  }

  /** Handle selection changes to ensure only one board has a cursor */
  onBoardSelectionChanged(boardIndex: number): void {
    if (boardIndex === 0) {
      this.board2.selected.set(null);
    } else if (boardIndex === 1) {
      this.board1.selected.set(null);
    }
  }

  onPupRoll(): void {
    if (this.orbState !== PUPOrbState.READY || this.orbDisabled) {
      return;
    }

    this.orbState = PUPOrbState.SPINNING;
    this.orbDisabled = true;
    this.rollingActionId = this.sendPlayerAction({ action: MechanicsActions.DRAW_PUP });
  }

  onUsePup(slotIndex: number): void {
    const slot = this.myPupSlots[slotIndex];
    if (!slot || slot.status !== 'ready' || slot.pupID === null) {
      return;
    }

    const action = this.resolveUseAction(slot.name);
    if (!action) {
      return;
    }

    const payload = this.buildUsePayload(action, slot.pupID);
    if (!payload) {
      return;
    }

    this.sendPlayerAction(payload);
    this.startCooldown(slotIndex);
    this.refreshOrbState();
  }

  private refreshOrbState(forcedState?: PUPOrbState): void {
    if (forcedState !== undefined) {
      this.orbState = forcedState;
    }

    const playerGameState = this.gameState.getPlayerState(this.gameState.myID).gameState;
    if (!playerGameState) {
      this.orbDisabled = true;
      this.orbState = PUPOrbState.IDLE;
      return;
    }

    if (this.orbState === PUPOrbState.SPINNING) {
      this.orbDisabled = true;
      return;
    }

    const hasEmptySlot = this.myPupSlots.some(slot => slot.status === 'empty');
    const isReady = playerGameState.pupProgress >= 100 && hasEmptySlot;

    if (isReady) {
      this.orbState = PUPOrbState.READY;
      this.orbDisabled = false;
      return;
    }

    this.orbState = forcedState ?? PUPOrbState.IDLE;
    this.orbDisabled = !hasEmptySlot;
  }

  private sendPlayerAction(request: OmitBaseAttrs<AugmentAction<PlayerActions>>): number {
    const actionData = {
      clientTime: this.gameState.timeCoordinator.clientTime,
      actionID: this.nextActionId++,
      ...request
    };

    this.gameState.pendingActions.set(actionData.actionID, actionData);
    const { action, ...data } = actionData;
    this.networkService.send(action, data);
    return actionData.actionID;
  }

  private handlePupDrawn(playerID: number, pupID: number): void {
    const slots = playerID === this.gameState.myID ? this.myPupSlots : this.opponentPupSlots;
    const emptyIndex = slots.findIndex(slot => slot.status === 'empty');
    if (emptyIndex === -1) {
      return;
    }

    const mapped = this.resolvePupConfig(pupID);
    slots[emptyIndex] = {
      pupID,
      name: mapped?.name ?? `PUP ${pupID}`,
      icon: mapped?.icon ?? null,
      status: 'ready'
    };
  }

  private resolvePupConfig(pupID: number): { name: string; icon: string } | null {
    if (!pupConfig.length) {
      return null;
    }

    const normalized = Math.abs(pupID) % pupConfig.length;
    const pup = pupConfig[normalized];
    return pup ? { name: pup.name, icon: pup.asset.icon } : null;
  }

  private resolveUseAction(pupName: string | null): PlayerActions | null {
    if (!pupName) {
      return null;
    }

    const map: Record<string, PlayerActions> = {
      Cryo: WaterPUPActions.USE_CRYO,
      Purity: WaterPUPActions.USE_PURITY,
      Inferno: FirePUPActions.USE_INFERNO,
      Metabolic: FirePUPActions.USE_METABOLIC,
      Entangle: WoodPUPActions.USE_ENTANGLE,
      Wisdom: WoodPUPActions.USE_WISDOM,
      Landslide: EarthPUPActions.USE_LANDSLIDE,
      Excavate: EarthPUPActions.USE_EXCAVATE,
      Lock: MetalPUPActions.USE_LOCK,
      Forge: MetalPUPActions.USE_FORGE
    };

    return map[pupName] ?? null;
  }

  private buildUsePayload(
    action: PlayerActions,
    pupID: number
  ): OmitBaseAttrs<AugmentAction<PlayerActions>> | null {
    const opponentID = 1 - this.gameState.myID;
    switch (action) {
      case WaterPUPActions.USE_CRYO:
      case FirePUPActions.USE_INFERNO:
        return { action, pupID, targetID: opponentID, cellIndex: 0 };
      case MetalPUPActions.USE_LOCK:
        return { action, pupID, targetID: opponentID, value: 0 };
      case WoodPUPActions.USE_ENTANGLE:
      case EarthPUPActions.USE_LANDSLIDE:
        return { action, pupID, targetID: opponentID };
      case EarthPUPActions.USE_EXCAVATE:
        return { action, pupID, cellIndex: 0 };
      case WoodPUPActions.USE_WISDOM:
      case FirePUPActions.USE_METABOLIC:
      case MetalPUPActions.USE_FORGE:
      case WaterPUPActions.USE_PURITY:
        return { action, pupID };
      default:
        return null;
    }
  }

  private startCooldown(slotIndex: number): void {
    const slot = this.myPupSlots[slotIndex];
    if (!slot) {
      return;
    }

    slot.status = 'cooldown';
    const expiresAt = Date.now() + DuelDemoPageComponent.PUP_COOLDOWN_MS;
    slot.cooldownExpiresAt = expiresAt;
    slot.cooldownRemainingMs = DuelDemoPageComponent.PUP_COOLDOWN_MS;

    this.scheduleCooldownTick(slotIndex);
  }

  private scheduleCooldownTick(slotIndex: number): void {
    const existing = this.cooldownIntervals.get(slotIndex);
    if (existing) {
      clearInterval(existing);
    }

    const interval = window.setInterval(() => {
      const slot = this.myPupSlots[slotIndex];
      if (!slot || slot.status !== 'cooldown' || !slot.cooldownExpiresAt) {
        clearInterval(interval);
        return;
      }

      const remaining = slot.cooldownExpiresAt - Date.now();
      slot.cooldownRemainingMs = Math.max(remaining, 0);

      if (remaining <= 0) {
        clearInterval(interval);
        this.cooldownIntervals.delete(slotIndex);
        this.myPupSlots[slotIndex] = {
          pupID: null,
          name: null,
          icon: null,
          status: 'empty'
        };
        this.refreshOrbState();
      }
    }, 200);

    this.cooldownIntervals.set(slotIndex, interval);
  }

  private clearCooldownIntervals(): void {
    for (const interval of this.cooldownIntervals.values()) {
      clearInterval(interval);
    }
    this.cooldownIntervals.clear();
  }
}
