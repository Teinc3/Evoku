import LobbyActions from "@shared/types/enums/actions/system/lobby";
import EnumHandler from "../EnumHandler";

import type SessionModel from "src/server/models/Session";
import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class LobbyHandler extends EnumHandler<LobbyActions> {
  constructor() {
    super();

    const handlerMap = {
      [LobbyActions.JOIN_QUEUE]: this.handleJoinQueue,
      [LobbyActions.LEAVE_QUEUE]: this.handleLeaveQueue
    };

    this.setHandlerMap(handlerMap);
  }

  private handleJoinQueue(_session: SessionModel, _data: AugmentAction<LobbyActions>): void {
    // Logic for handling join queue action
  }

  private handleLeaveQueue(_session: SessionModel, _data: AugmentAction<LobbyActions>): void {
    // Logic for handling leave queue action
  }
}