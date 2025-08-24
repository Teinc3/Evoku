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

    const { result, serverTime } = this.room.stateController.setCellValue(playerID, data);

    // Broadcast
    if (result) {
      this.room.broadcast(MechanicsActions.CELL_SET, {
        serverTime: serverTime!,
        playerID,
        ...data
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
    }

    return result;
  }

  private handleDrawPUP(
    _session: SessionModel,
    _data: AugmentAction<MechanicsActions.DRAW_PUP>
  ): boolean {
    return true;
  }
  
}