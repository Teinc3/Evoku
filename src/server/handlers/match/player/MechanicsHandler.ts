import ProtocolActions from "@shared/types/enums/actions/match/protocol";
import MechanicsActions from "@shared/types/enums/actions/match/player/mechanics";
import EnumHandler from "../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { IMatchEnumHandler } from "../../../types/handler";
import type SessionModel from "../../../models/networking/Session";
import type RoomModel from "../../../models/networking/Room";


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

    const { clientTime, cellIndex, actionID, value } = data;
    const serverTime = clientTime; // TODO: Implement server time synchronization (Filler)
    const result = this.room.logic.setCellValue(playerID, cellIndex, value);

    // Broadcast
    if (result) {
      this.room.broadcast(MechanicsActions.CELL_SET, {
        serverTime,
        playerID,
        ...data
      });
    } else {
      this.room.broadcast(
        ProtocolActions.REJECT_ACTION,
        {
          actionID,
          gameStateHash: this.room.logic.computeHash()
        },
        { to: [session.uuid] }
      )
    }

    //this.room.logAction(serverTime, playerID, result, data);
    return result;
  }

  private handleDrawPUP(
    _session: SessionModel,
    _data: AugmentAction<MechanicsActions.DRAW_PUP>
  ): boolean {
    return true;
  }
  
}