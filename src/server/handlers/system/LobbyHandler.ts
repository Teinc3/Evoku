import LobbyActions from "@shared/types/enums/actions/system/lobby";
import EnumHandler from "../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { SessionModel } from "../../models/networking";
import type { MatchmakingManager } from "../../managers";


export default class LobbyHandler extends EnumHandler<LobbyActions> {
  private matchmakingManager?: MatchmakingManager;

  constructor() {
    super();

    const handlerMap = {
      [LobbyActions.JOIN_QUEUE]: this.handleJoinQueue,
      [LobbyActions.LEAVE_QUEUE]: this.handleLeaveQueue
    };

    this.setHandlerMap(handlerMap);
  }

  public setMatchmakingManager(matchmakingManager: MatchmakingManager): void {
    this.matchmakingManager = matchmakingManager;
  }

  private handleJoinQueue(
    session: SessionModel,
    data: AugmentAction<LobbyActions.JOIN_QUEUE>
  ): boolean {
    if (!this.matchmakingManager) {
      return false;
    }
    return this.matchmakingManager.joinQueue(session, data.username);
  }

  private handleLeaveQueue(
    session: SessionModel,
    _data: AugmentAction<LobbyActions.LEAVE_QUEUE>
  ): boolean {
    if (!this.matchmakingManager) {
      return false;
    }
    this.matchmakingManager.leaveQueue(session.uuid);
    return true;
  }
}