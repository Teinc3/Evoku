import WaterPUPActions from "@shared/types/enums/actions/match/player/powerups/water";
import EnumHandler from "../../../EnumHandler";
import reject from "../../../../utils/reject";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { IMatchEnumHandler } from "../../../../types/handler";
import type { RoomModel } from "../../../../models/networking";
import type { SessionModel } from "../../../../models/networking";


export default class WaterPUPHandler extends EnumHandler<WaterPUPActions>
  implements IMatchEnumHandler<WaterPUPActions> {

  constructor(public readonly room: RoomModel) {
    super();

    const handlerMap = {
      [WaterPUPActions.USE_CRYO]: this.handleUseCryo,
      [WaterPUPActions.USE_PURITY]: this.handleUsePurity
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseCryo(
    session: SessionModel,
    data: AugmentAction<WaterPUPActions.USE_CRYO>
  ): boolean {
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined || data.targetID !== 1 - playerID
      || data.cellIndex < 0 || data.cellIndex >= 81) {
      return false;
    }

    const { action, clientTime, ...payload } = data;
    const result = this.room.stateController.consumePUP(action, playerID, data.pupID, clientTime);

    if (result === false) {
      reject(this.room, session, data.actionID);
      return true;
    }

    this.room.broadcast(WaterPUPActions.CRYO_USED, {
      serverTime: result,
      playerID,
      ...payload
    });

    return true;
  }

  private handleUsePurity(
    session: SessionModel,
    data: AugmentAction<WaterPUPActions.USE_PURITY>
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

    this.room.broadcast(WaterPUPActions.PURITY_USED, {
      serverTime: result,
      playerID,
      ...payload
    });

    return true;
  }
  
}
