import ProtocolActions from "@shared/types/enums/actions/match/protocol";
import EnumHandler from "../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { PongContract } from "@shared/types/contracts/match/protocol/PingPongContract";
import type { IMatchEnumHandler } from "../../types/handler";
import type { RoomModel } from "../../models/networking";
import type { SessionModel } from "../../models/networking";


export default class ProtocolHandler extends EnumHandler<ProtocolActions>
  implements IMatchEnumHandler<ProtocolActions> {

  constructor(public readonly room: RoomModel) {
    super();

    const handlerMap = {
      [ProtocolActions.PONG]: this.handlePong
    };

    this.setHandlerMap(handlerMap);
  }

  private handlePong(session: SessionModel, data: AugmentAction<ProtocolActions.PONG>): boolean {
    const { clientTime, serverTime } = data as PongContract;
    
    // Get playerID from the room's player mapping
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined) {
      return false; // Session not found in room
    }
    
    // Update time synchronization for this player
    this.room.timeService.handlePong(playerID, clientTime, serverTime);
    
    return true;
  }
  
}