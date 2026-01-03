import { Injectable } from '@angular/core';

import NetworkService from '../../../app/services/network';
import MatchActionDispatcher from './MatchActionDispatcher';

import type {
  BoardAccessContext,
  PupSlotShakeContext
} from '../../../types/handlers/MatchActionDispatcherContext';


@Injectable()
export default class DuelActionDispatcher extends MatchActionDispatcher {
  private myBoardAccess?: BoardAccessContext;
  private enemyBoardAccess?: BoardAccessContext;
  private pupSlotShake?: PupSlotShakeContext;

  public constructor(networkService: NetworkService) {
    super(networkService);
  }

  public setAccessContexts(
    myBoardAccess: BoardAccessContext,
    enemyBoardAccess: BoardAccessContext,
    pupSlotShake: PupSlotShakeContext | undefined
  ): void {
    this.myBoardAccess = myBoardAccess;
    this.enemyBoardAccess = enemyBoardAccess;
    this.pupSlotShake = pupSlotShake;
  }

  protected getMyBoardAccess(): BoardAccessContext {
    if (!this.myBoardAccess) {
      throw new Error('DuelActionDispatcher: my board access not set.');
    }
    return this.myBoardAccess;
  }

  protected getTargetBoardAccess(): BoardAccessContext {
    if (!this.enemyBoardAccess) {
      throw new Error('DuelActionDispatcher: enemy board access not set.');
    }
    return this.enemyBoardAccess;
  }

  protected getTargetPlayerID(): number {
    return 1 - this.getGameState().myID;
  }

  protected getPupSlotShake(): PupSlotShakeContext | undefined {
    return this.pupSlotShake;
  }
}
