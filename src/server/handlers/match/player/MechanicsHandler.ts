import { ProtocolActions, MechanicsActions } from "@shared/types/enums/actions";
import EnumHandler from "../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { IMatchEnumHandler } from "../../../types/handler";
import type { RoomModel } from "../../../models/networking";
import type { SessionModel } from "../../../models/networking";


export default class MechanicsHandler extends EnumHandler<MechanicsActions>
  implements IMatchEnumHandler<MechanicsActions> {

  constructor(public readonly room: RoomModel) {
    super();

    const handlerMap = {
      [MechanicsActions.SET_CELL]: this.handleSetCell,
      [MechanicsActions.DRAW_PUP]: this.handleDrawPUP
    };

    this.setHandlerMap(handlerMap);
  }

  private handleSetCell(
    session: SessionModel,
    data: AugmentAction<MechanicsActions.SET_CELL>
  ): boolean {
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined) {
      return false;
    }

    // No need to extract clientTime field from payload - as CELL_SET packet won't encode it
    const { action: _, ...payload } = data;
    const { result, serverTime } = this.room.stateController.setCellValue(playerID, payload);

    // Broadcast
    if (result) {
      this.room.broadcast(MechanicsActions.CELL_SET, {
        serverTime: serverTime!,
        playerID,
        ...payload
      });
    } else {
      this.room.broadcast(
        ProtocolActions.REJECT_ACTION,
        {
          actionID: data.actionID,
          gameStateHash: this.room.stateController.computeHash()
        },
        { to: [session.uuid] }
      );

      // TODO: Log invalid action attempt, which will decide if disconnection is necessary
      // For now, just don't disconnect
    }

    return true;
  }

  private handleDrawPUP(
    session: SessionModel,
    _data: AugmentAction<MechanicsActions.DRAW_PUP>
  ): boolean {
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined) {
      return false;
    }

    const slotIndex = this.room.stateController.reservePUPDraw(playerID);
    if (slotIndex === -1) {
      return false;
    }

    setTimeout(() => {
      const pupDrawn = this.room.stateController.drawRandomPUP(playerID, slotIndex);
      if (!pupDrawn) {
        return;
      }

      this.room.broadcast(MechanicsActions.PUP_DRAWN, {
        playerID,
        ...pupDrawn
      });
    }, 5000);

    return true;
  }
  
}
