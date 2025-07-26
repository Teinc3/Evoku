import SessionActions from "@shared/types/enums/actions/system/session";
import EnumHandler from "../EnumHandler";

import type SessionModel from "src/server/models/Session";
import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class SessionHandler extends EnumHandler<SessionActions> {
  constructor() {
    super();

    const handlerMap = {
      [SessionActions.HEARTBEAT]: this.handleHeartbeat,
    };

    this.setHandlerMap(handlerMap);
  }

  private handleHeartbeat(_session: SessionModel, _data: AugmentAction<SessionActions>): void {
    // Logic for handling heartbeat action
  }
}