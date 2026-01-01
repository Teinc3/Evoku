import MetalPUPActions from "@shared/types/enums/actions/match/player/powerups/metal";
import EnumHandler from "../../../EnumHandler";
import reject from "../../../../utils/reject";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { IMatchEnumHandler } from "../../../../types/handler";
import type { RoomModel } from "../../../../models/networking";
import type { SessionModel } from "../../../../models/networking";


export default class MetalPUPHandler extends EnumHandler<MetalPUPActions>
  implements IMatchEnumHandler<MetalPUPActions> {

  constructor(public readonly room: RoomModel) {
    super();

    const handlerMap = {
      [MetalPUPActions.USE_LOCK]: this.handleUseLock,
      [MetalPUPActions.USE_FORGE]: this.handleUseForge
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseLock(
    session: SessionModel,
    data: AugmentAction<MetalPUPActions.USE_LOCK>
  ): boolean {
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined || data.value <= 0 || data.targetID !== 1 - playerID) {
      return false;
    }

    const { action, clientTime, ...payload } = data;
    const result = this.room.stateController.consumePUP(action, playerID, data.pupID, clientTime);

    if (result === false) {
      reject(this.room, session, data.actionID);
      return true;
    }

    this.room.broadcast(MetalPUPActions.LOCK_USED, {
      serverTime: result,
      playerID,
      ...payload
    });

    return true;
  }

  private handleUseForge(
    session: SessionModel,
    data: AugmentAction<MetalPUPActions.USE_FORGE>
  ): boolean {
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined) {
      return false;
    }

    const { action, clientTime, ...payload } = data;
    const result = this.room.stateController.consumePUP(action, playerID, data.pupID, clientTime);

    if (result === false) {
      reject(this.room, session, data.actionID);
      return true;
    }

    this.room.broadcast(MetalPUPActions.FORGE_USED, {
      serverTime: result,
      playerID,
      ...payload
    });

    return true;
  }
}
