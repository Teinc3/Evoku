import { Subscription } from 'rxjs';

import ActionGuard from '@shared/types/utils/typeguards/actions';
import MatchStatus from '@shared/types/enums/matchstatus';
import {
  MechanicsActions,
  LifecycleActions,
  ProtocolActions,
} from '@shared/types/enums/actions/';
import GameStateManager from '../../GameStateManager';
import NetworkService from '../../../app/services/network';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type ActionEnum from '@shared/types/enums/actions';
import type {
  MatchActionListenerContext,
  PacketHandler
} from '../../../types/handlers/MatchActionListenerContext';


/**
 * Orchestrates the client-side inbound (network -> state) flow for a match instance.
 *
 * Like the outbound dispatchers, this object is intended to be provided/owned per
 * game mode instance (e.g. Duel, Time Attack) rather than globally.
 */
export default abstract class MatchActionListener {
  private gameState?: GameStateManager;
  private context?: MatchActionListenerContext;

  private readonly packetHandlerMap: Map<ActionEnum, PacketHandler<ActionEnum>>;

  protected constructor(
    protected readonly networkService: NetworkService
  ) {
    this.packetHandlerMap = new Map<ActionEnum, PacketHandler<ActionEnum>>();

    this.addPacketHandler(LifecycleActions.GAME_INIT, this.onGameInit.bind(this));
    this.addPacketHandler(LifecycleActions.GAME_OVER, this.onGameOver.bind(this));
    this.addPacketHandler(LifecycleActions.PHASE_TRANSITION, this.onPhaseTransition.bind(this));
    this.addPacketHandler(ProtocolActions.UPDATE_PROGRESS, this.onUpdateProgress.bind(this));
    this.addPacketHandler(MechanicsActions.CELL_SET, this.onCellSet.bind(this));
    this.addPacketHandler(ProtocolActions.REJECT_ACTION, this.onRejectAction.bind(this));
    this.addPacketHandler(ProtocolActions.PING, this.onPing.bind(this));
    this.addPacketHandler(MechanicsActions.PUP_DRAWN, this.onPupDrawn.bind(this));
    this.addPacketHandler(MechanicsActions.PUP_SPUN, this.onPupSpun.bind(this));
  }

  private addPacketHandler<GenericAction extends ActionEnum>(
    action: GenericAction,
    handler: PacketHandler<GenericAction>
  ): void {
    this.packetHandlerMap.set(action, handler as PacketHandler<ActionEnum>);
  }

  public gameInit(gameState: GameStateManager): void {
    this.gameState = gameState;
  }

  public setContext(context: MatchActionListenerContext): void {
    this.context = context;
  }
  protected getContext(): MatchActionListenerContext | undefined {
    return this.context;
  }

  protected getGameState(): GameStateManager {
    if (!this.gameState) {
      throw new Error('MatchActionListener not initialized with a GameStateManager.');
    }
    return this.gameState;
  }

  /** Creates a Subscription containing all inbound network subscriptions. */
  public bind(): Subscription {
    const subscriptions = new Subscription();
    this.registerSubscriptions(subscriptions);
    return subscriptions;
  }

  /** Registers inbound subscriptions onto the provided Subscription instance. */
  protected registerSubscriptions(subscriptions: Subscription): void {
    subscriptions.add(this.networkService.onDisconnect().subscribe(() => {
      this.getContext()?.onDisconnect?.();
    }));

    for (const [action, handler] of this.packetHandlerMap.entries()) {
      subscriptions.add(this.networkService.onPacket(action).subscribe(data => {
        const augmentedData = {
          action,
          ...data,
        } as AugmentAction<ActionEnum>;

        handler(augmentedData);
      }));
    }
  }

  protected onGameInit(data: AugmentAction<LifecycleActions.GAME_INIT>): void {
    const gameState = this.getGameState();
    gameState.initGameStates(data.cellValues);
    gameState.timeCoordinator.onGameInit();
    gameState.matchState.status = MatchStatus.ONGOING;
  }

  protected onGameOver(_data: AugmentAction<LifecycleActions.GAME_OVER>): void {
    this.getGameState().matchState.status = MatchStatus.ENDED;
  }

  protected onPhaseTransition(data: AugmentAction<LifecycleActions.PHASE_TRANSITION>): void {
    this.getGameState().matchState.phase = data.newPhase;
  }

  protected onUpdateProgress(data: AugmentAction<ProtocolActions.UPDATE_PROGRESS>): void {
    const gameState = this.getGameState();
    const playerGameState = gameState.getPlayerState(data.playerID).gameState;

    if (!playerGameState) {
      return;
    }

    if (data.isBoard) {
      playerGameState.boardState.progress = data.progress;
    } else {
      playerGameState.pupProgress = data.progress;
    }
  }

  protected onCellSet(data: AugmentAction<MechanicsActions.CELL_SET>): void {
    const gameState = this.getGameState();
    const board = gameState.getPlayerBoard(data.playerID);
    if (!board) {
      return;
    }

    const pendingAction = (data.playerID === gameState.myID)
      ? gameState.pendingActions.get(data.actionID)
      : undefined;

    let clientTime: number;
    if (pendingAction) {
      clientTime = pendingAction.clientTime;
      gameState.pendingActions.delete(data.actionID);
    } else {
      clientTime = gameState.timeCoordinator.estimateClientTime(data.serverTime);
    }

    board.confirmCellSet(data.cellIndex, data.value, clientTime);
  }

  protected onRejectAction(data: AugmentAction<ProtocolActions.REJECT_ACTION>): void {
    const gameState = this.getGameState();
    const pendingAction = gameState.pendingActions.get(data.actionID);
    if (!pendingAction) {
      return;
    }

    gameState.pendingActions.delete(data.actionID);

    if (ActionGuard.isActionContract(MechanicsActions.SET_CELL, pendingAction)) {
      this.getContext()?.onCellRejection?.(pendingAction.cellIndex, pendingAction.value);
      return;
    }

    if (ActionGuard.isPUPActionsData(pendingAction)) {
      const playerGameState = gameState.getPlayerState(gameState.myID).gameState;
      if (!playerGameState) {
        return;
      }

      const slot = playerGameState.powerups.find(s => s.pup?.pupID === pendingAction.pupID);
      if (slot) {
        slot.pendingCooldownEnd = undefined;
      }
    }
  }

  protected onPing(data: AugmentAction<ProtocolActions.PING>): void {
    const gameState = this.getGameState();

    gameState.handlePing(data, (action, pongData) => {
      this.networkService.send(action, pongData);
    });
  }

  protected onPupDrawn(data: AugmentAction<MechanicsActions.PUP_DRAWN>): void {
    const gameState = this.getGameState();
    const { playerID, slotIndex, ...pupData } = data;

    const playerGameState = gameState.getPlayerState(playerID).gameState;
    if (!playerGameState) {
      return;
    }

    const slot = playerGameState.powerups[slotIndex];
    slot.pup = pupData;
    slot.locked = false;
    slot.pendingCooldownEnd = undefined;

    if (playerID === gameState.myID) {
      this.getContext()?.onBeginPupSettling?.();
    }
  }

  protected onPupSpun(data: AugmentAction<MechanicsActions.PUP_SPUN>): void {
    const gameState = this.getGameState();

    const playerGameState = gameState.getPlayerState(gameState.myID).gameState;
    if (!playerGameState) {
      return;
    }

    const slot = playerGameState.powerups[data.slotIndex];
    if (!slot) {
      return;
    }

    slot.locked = true;
    this.getContext()?.onSetPupSettlingType?.(data.element);
  }
}
