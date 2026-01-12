import {
  MechanicsActions,
  WaterPUPActions,
  FirePUPActions,
  WoodPUPActions,
  EarthPUPActions,
  MetalPUPActions,
  type PlayerActions
} from '@shared/types/enums/actions/';
import pupConfig from '@config/shared/pup.json';
import sharedConfig from '@config/shared/base.json';
import GameStateManager from '../../GameStateManager';
import NetworkService from '../../../app/services/network';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { OmitBaseAttrs } from '../../../types/OmitAttrs';
import type {
  BoardAccessContext,
  PupSlotShakeContext
} from '../../../types/handlers/MatchActionDispatcherContext';


/**
 * Orchestrates the client-side optimistic outbound action flow for a match instance.
 *
 * This object is intended to be provided/owned per game mode instance
 * (e.g. Duel, Time Attack) rather than globally.
 */
export default abstract class MatchActionDispatcher {
  private nextActionId = 0;
  private gameState?: GameStateManager;
  private readonly pupUseHandlers: Array<((slotIndex: number) => boolean) | undefined>;

  protected abstract getTargetPlayerID(): number;
  protected abstract getMyBoardAccess(): BoardAccessContext;
  protected abstract getTargetBoardAccess(): BoardAccessContext;
  protected abstract getPupSlotShake(): PupSlotShakeContext | undefined;

  protected constructor(
    protected readonly networkService: NetworkService
  ) {
    this.pupUseHandlers = this.createPupUseHandlers();
  }

  public gameInit(gameState: GameStateManager): void {
    this.gameState = gameState;
  }

  protected getGameState(): GameStateManager {
    if (!this.gameState) {
      throw new Error('MatchActionDispatcher not initialized with a GameStateManager.');
    }
    return this.gameState;
  }

  /** Wraps and sends an action packet, and stores it for potential optimistic lookups. */
  public dispatch(request: OmitBaseAttrs<AugmentAction<PlayerActions>>): void {
    const gameState = this.getGameState();

    const actionData = {
      clientTime: gameState.timeCoordinator.clientTime,
      actionID: this.nextActionId++,
      ...request
    };

    gameState.pendingActions.set(actionData.actionID, actionData);

    const { action, ...data } = actionData;
    this.networkService.send(action, data);
  }

  /**
   * Executes the shared "use PUP" flow for the local player.
   * Returns true if an action was dispatched.
   */
  public tryUsePUP(slotIndex: number): boolean {
    const gameState = this.getGameState();
    const playerGameState = gameState.getPlayerState(gameState.myID).gameState;

    if (!playerGameState) {
      return false;
    }

    const slot = playerGameState.powerups[slotIndex];
    const now = gameState.timeCoordinator.clientTime;
    const effectiveCooldownEnd = Math.max(slot.lastCooldownEnd, slot.pendingCooldownEnd ?? 0);

    if (!slot.pup || slot.locked || effectiveCooldownEnd > now) {
      this.getPupSlotShake()?.(slotIndex);
      return false;
    }

    const { pup } = slot;


    const pupHandler = this.pupUseHandlers[pup.type];
    if (!pupHandler || !pupHandler(slotIndex)) {
      this.getPupSlotShake()?.(slotIndex);
      return false;
    }

    if (pupConfig[pup.type].offensive === true) {
      const duration = sharedConfig.game.challenge.duration[gameState.matchState.phase];
      slot.pendingCooldownEnd = now + duration;
    }

    return true;
  }

  public drawPup(): void {
    this.dispatch({
      action: MechanicsActions.DRAW_PUP
    });
  }

  private createPupUseHandlers(): Array<((slotIndex: number) => boolean) | undefined> {
    const handlers: Array<((slotIndex: number) => boolean) | undefined> = [];

    handlers[0] = this.handleUseCryo.bind(this);
    handlers[1] = this.handleUsePurity.bind(this);
    handlers[2] = this.handleUseInferno.bind(this);
    handlers[3] = this.handleUseMetabolic.bind(this);
    handlers[4] = this.handleUseEntangle.bind(this);
    handlers[5] = this.handleUseWisdom.bind(this);
    handlers[6] = this.handleUseLandslide.bind(this);
    handlers[7] = this.handleUseExcavate.bind(this);
    handlers[8] = this.handleUseLock.bind(this);
    handlers[9] = this.handleUseForge.bind(this);

    return handlers;
  }

  private getMyPupID(slotIndex: number): number {
    const gameState = this.getGameState();
    const playerGameState = gameState.getPlayerState(gameState.myID).gameState;

    if (!playerGameState) {
      throw new Error('Player game state missing while using a PUP.');
    }

    const slot = playerGameState.powerups[slotIndex];
    if (!slot.pup) {
      throw new Error('Attempted to use a PUP from an empty slot.');
    }

    return slot.pup.pupID;
  }

  private handleUseCryo(slotIndex: number): boolean {
    const targetID = this.getTargetPlayerID();
    const enemyCellIndex = this.getTargetBoardAccess().selected();

    if (enemyCellIndex === null) {
      this.getPupSlotShake()?.(slotIndex);
      return false;
    }

    this.dispatch({
      action: WaterPUPActions.USE_CRYO,
      pupID: this.getMyPupID(slotIndex),
      targetID,
      cellIndex: enemyCellIndex,
    });
    return true;
  }

  private handleUsePurity(slotIndex: number): boolean {
    this.dispatch({
      action: WaterPUPActions.USE_PURITY,
      pupID: this.getMyPupID(slotIndex),
    });
    return true;
  }

  private handleUseInferno(slotIndex: number): boolean {
    const targetID = this.getTargetPlayerID();
    const enemyCellIndex = this.getTargetBoardAccess().selected();

    if (enemyCellIndex === null) {
      this.getPupSlotShake()?.(slotIndex);
      return false;
    }

    this.dispatch({
      action: FirePUPActions.USE_INFERNO,
      pupID: this.getMyPupID(slotIndex),
      targetID,
      cellIndex: enemyCellIndex,
    });
    return true;
  }

  private handleUseMetabolic(slotIndex: number): boolean {
    this.dispatch({
      action: FirePUPActions.USE_METABOLIC,
      pupID: this.getMyPupID(slotIndex),
    });
    return true;
  }

  private handleUseEntangle(slotIndex: number): boolean {
    const targetID = this.getTargetPlayerID();

    this.dispatch({
      action: WoodPUPActions.USE_ENTANGLE,
      pupID: this.getMyPupID(slotIndex),
      targetID,
    });
    return true;
  }

  private handleUseWisdom(slotIndex: number): boolean {
    this.dispatch({
      action: WoodPUPActions.USE_WISDOM,
      pupID: this.getMyPupID(slotIndex),
    });
    return true;
  }

  private handleUseLandslide(slotIndex: number): boolean {
    const targetID = this.getTargetPlayerID();

    this.dispatch({
      action: EarthPUPActions.USE_LANDSLIDE,
      pupID: this.getMyPupID(slotIndex),
      targetID,
    });
    return true;
  }

  private handleUseExcavate(slotIndex: number): boolean {
    const myCellIndex = this.getMyBoardAccess().selected();

    if (myCellIndex === null) {
      this.getPupSlotShake()?.(slotIndex);
      return false;
    }

    this.dispatch({
      action: EarthPUPActions.USE_EXCAVATE,
      pupID: this.getMyPupID(slotIndex),
      cellIndex: myCellIndex,
    });
    return true;
  }

  private handleUseLock(slotIndex: number): boolean {
    const targetID = this.getTargetPlayerID();

    const myBoard = this.getMyBoardAccess();
    const targetBoard = this.getTargetBoardAccess();

    const board1Selected = myBoard.selected();
    const board2Selected = targetBoard.selected();

    const value = board1Selected !== null
      ? myBoard.getCellValue(board1Selected)
      : board2Selected !== null
        ? targetBoard.getCellValue(board2Selected)
        : null;

    if (value === null || value <= 0) {
      this.getPupSlotShake()?.(slotIndex);
      return false;
    }

    this.dispatch({
      action: MetalPUPActions.USE_LOCK,
      pupID: this.getMyPupID(slotIndex),
      targetID,
      value,
    });
    return true;
  }

  private handleUseForge(slotIndex: number): boolean {
    this.dispatch({
      action: MetalPUPActions.USE_FORGE,
      pupID: this.getMyPupID(slotIndex),
    });
    return true;
  }
}
