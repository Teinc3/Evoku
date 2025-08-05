import ProtocolActions from "@shared/types/enums/actions/match/protocol";
import EnumHandler from "../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../models/networking/Session";
import type RoomModel from "../../models/networking/Room";


export default class ProtocolHandler extends EnumHandler<ProtocolActions> {
  constructor(private readonly _room: RoomModel) {
    super();

    const handlerMap = {
      [ProtocolActions.PONG]: this.handlePong
    };

    this.setHandlerMap(handlerMap);
  }

  private handlePong(_session: SessionModel, _data: AugmentAction<ProtocolActions>): boolean {
    return true;
  }
}