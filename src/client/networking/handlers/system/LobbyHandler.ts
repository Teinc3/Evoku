import LobbyActions from "@shared/types/enums/actions/system/lobby";
import EnumHandler from "../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class LobbyHandler extends EnumHandler<LobbyActions> {
  constructor() {
    super();

    const handlerMap = {
      [LobbyActions.QUEUE_UPDATE]: this.handleQueueUpdate,
      [LobbyActions.MATCH_FOUND]: this.handleMatchFound,
    };

    this.setHandlerMap(handlerMap);
  }

  private handleQueueUpdate(data: AugmentAction<LobbyActions.QUEUE_UPDATE>): void {
    // Handle queue status updates
    console.debug('Queue status updated with data:', data);
  }

  private handleMatchFound(data: AugmentAction<LobbyActions.MATCH_FOUND>): void {
    // Handle match found notification
    console.debug('Match found with data:', data);
  }
}
