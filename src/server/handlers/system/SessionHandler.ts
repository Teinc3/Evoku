import SessionActions from "@shared/types/enums/actions/system/session";
import sharedConfig from "@shared/config";
import EnumHandler from "../EnumHandler";
import guestAuthService from "../../services/auth";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { SessionModel } from "../../models/networking";


export default class SessionHandler extends EnumHandler<SessionActions> {
  constructor() {
    super();

    const handlerMap = {
      [SessionActions.HEARTBEAT]: this.handleHeartbeat,
      [SessionActions.AUTH]: this.handleAuth,
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
  private async handleHeartbeat(
    _session: SessionModel, 
    _data: AugmentAction<SessionActions>
  ): Promise<boolean> {
    return true;
  }

  /**
   * Handles authentication of a session.
   * Validates the client version and authentication token using GuestAuthService.
   * If successful, marks the session as authenticated.
   * If validation fails, returns false which triggers disconnection.
   */
  private async handleAuth(
    session: SessionModel, 
    data: AugmentAction<SessionActions.AUTH>
  ): Promise<boolean> {
    // Check if already authenticated
    if (session.isAuthenticated()) {
      return false;
    }

    const { token, version } = data;

    // Validate client version
    if (version !== sharedConfig.version) {
      return false;
    }

    // Validate token using GuestAuthService
    try {
      const res = await guestAuthService.authenticate(token);
      await session.setAuthenticated(res.userID);
      return true;
    } catch {
      return false;
    }
  }
}