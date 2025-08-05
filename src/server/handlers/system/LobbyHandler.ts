import LobbyActions from "@shared/types/enums/actions/system/lobby";
import EnumHandler from "../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../models/networking/Session";


export default class LobbyHandler extends EnumHandler<LobbyActions> {
  constructor() {
    super();

    const handlerMap = {
      [LobbyActions.JOIN_QUEUE]: this.handleJoinQueue,
      [LobbyActions.LEAVE_QUEUE]: this.handleLeaveQueue
    };

    this.setHandlerMap(handlerMap);
  }

  private handleJoinQueue(_session: SessionModel, _data: AugmentAction<LobbyActions>): boolean {
    return true;
  }

  private handleLeaveQueue(_session: SessionModel, _data: AugmentAction<LobbyActions>): boolean {
    return true;
  }
}