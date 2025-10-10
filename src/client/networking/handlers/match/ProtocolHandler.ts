import ProtocolActions from "@shared/types/enums/actions/match/protocol";
import EnumHandler from "../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type WebSocketService from "../../services/WebSocketService";


export default class ProtocolHandler extends EnumHandler<ProtocolActions> {
  constructor(private networkService: WebSocketService) {
    super();

    const handlerMap = {
      [ProtocolActions.PING]: this.handlePing,
      [ProtocolActions.REJECT_ACTION]: this.handleRejectAction,
      [ProtocolActions.BOARD_PROGRESS]: this.handleBoardProgress,
    };

    this.setHandlerMap(handlerMap);
  }

  private handlePing(_data: AugmentAction<ProtocolActions.PING>): void {
    // Handle server ping - could implement latency calculation here
    // TODO: Send PONG response when PONG action is implemented
  }

  private handleRejectAction(_data: AugmentAction<ProtocolActions.REJECT_ACTION>): void {
    // Handle action rejection from server
    console.debug('Server rejected an action');
  }

  private handleBoardProgress(_data: AugmentAction<ProtocolActions.BOARD_PROGRESS>): void {
    // Handle board progress update from server
    // TODO: Update game state with board progress information
  }
}
