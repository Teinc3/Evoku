import SessionActions from "@shared/types/enums/actions/system/session";
import sharedConfig from "@shared/config";
import EnumHandler from "../EnumHandler";
import { verifyGuestToken } from "../../utils/jwt";
import redisService from "../../services/RedisService";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../models/networking/Session";


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
  private handleHeartbeat(_session: SessionModel, _data: AugmentAction<SessionActions>): boolean {
    return true;
  }

  /**
   * Handles authentication of a session.
   * Validates the client version and authentication token against Redis.
   * If successful, marks the session as authenticated.
   * If validation fails, returns false which triggers disconnection.
   */
  private async handleAuth(
    session: SessionModel, 
    data: AugmentAction<SessionActions.AUTH>
  ): Promise<boolean> {
    // Check if already authenticated
    if (session.isAuthenticated()) {
      console.warn(`Session ${session.uuid} attempted to authenticate twice`);
      return false;
    }

    const { token, version } = data;

    // Validate client version
    if (version !== sharedConfig.version) {
      console.warn(
        `Session ${session.uuid} version mismatch: ` +
        `client=${version}, server=${sharedConfig.version}`
      );
      return false;
    }

    // Verify the JWT token
    const playerId = verifyGuestToken(token);
    if (!playerId) {
      console.warn(`Session ${session.uuid} invalid token`);
      return false;
    }

    // Check if player exists in Redis
    const key = `guest:player:${playerId}`;
    const playerData = await redisService.get(key);
    if (!playerData) {
      console.warn(`Session ${session.uuid} player not found in Redis: ${playerId}`);
      return false;
    }

    // Authentication successful
    session.setAuthenticated();
    console.log(`Session ${session.uuid} authenticated successfully for player ${playerId}`);
    return true;
  }
}