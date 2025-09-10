import SessionActions from "@shared/types/enums/actions/system/session";
import EnumHandler from "../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../models/networking/Session";


export default class SessionHandler extends EnumHandler<SessionActions> {
  constructor() {
    super();

    const handlerMap = {
      [SessionActions.HEARTBEAT]: this.handleHeartbeat,
    };

    this.setHandlerMap(handlerMap);
  }

  /**
   * Heartbeat is simply a packet that does nothing but confirm the connection is alive, 
   * if no packets are sent from the client for 15 seconds.
   * 
   * The latter is already handled in general by the ServerSocket and Session's transport layer.
   * Therefore theres not really any action needed except to confirm that the action is valid.
   */
  private handleHeartbeat(_session: SessionModel, _data: AugmentAction<SessionActions>): boolean {
    return true;
  }
}