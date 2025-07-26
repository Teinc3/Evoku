import ProtocolActions from "@shared/types/enums/actions/match/protocol";
import EnumHandler from "../EnumHandler";

import type SessionModel from "src/server/models/Session";
import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class ProtocolHandler extends EnumHandler<ProtocolActions> {
  constructor() {
    super();

    const handlerMap = {
      [ProtocolActions.PONG]: this.handlePong
    };

    this.setHandlerMap(handlerMap);
  }

  private handlePong(_session: SessionModel, _data: AugmentAction<ProtocolActions>): void {
    // Logic for handling pong action
  }
}