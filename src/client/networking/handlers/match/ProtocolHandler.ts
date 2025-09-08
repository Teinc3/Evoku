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
    };

    this.setHandlerMap(handlerMap);
  }

  private handlePing(_data: AugmentAction<ProtocolActions.PING>): void {
    // Handle server ping - calculate latency and respond with PONG
    if (this.networkService?.lastPingAt !== undefined && this.networkService.lastPingAt !== null) {
      this.networkService.latencyMs = Date.now() - this.networkService.lastPingAt;
      this.networkService.lastPingAt = null;
    }

    console.debug('Received ping from server, latency:', this.networkService.latencyMs);
    // TODO: Send PONG response when PONG action is implemented
  }

  private handleRejectAction(_data: AugmentAction<ProtocolActions.REJECT_ACTION>): void {
    // Handle action rejection from server
    console.debug('Server rejected an action');
  }
}
