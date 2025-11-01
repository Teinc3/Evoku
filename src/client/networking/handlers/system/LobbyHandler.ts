import LobbyActions from "@shared/types/enums/actions/system/lobby";
import EnumHandler from "../EnumHandler";
import AppView from "../../../types/enums/app-view.enum";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type ViewStateService from "../../../app/services/view-state.service";
import type MatchmakingService from "../../../app/services/matchmaking.service";


export default class LobbyHandler extends EnumHandler<LobbyActions> {
  private matchmakingService: MatchmakingService | null = null;
  private viewStateService: ViewStateService | null = null;

  constructor() {
    super();

    const handlerMap = {
      [LobbyActions.QUEUE_UPDATE]: this.handleQueueUpdate,
      [LobbyActions.MATCH_FOUND]: this.handleMatchFound,
    };

    this.setHandlerMap(handlerMap);
  }

  /**
   * Set the matchmaking service instance to use for updating state
   */
  setMatchmakingService(service: MatchmakingService): void {
    this.matchmakingService = service;
  }

  /**
   * Set the view state service instance to use for navigation
   */
  setViewStateService(service: ViewStateService): void {
    this.viewStateService = service;
  }

  private handleQueueUpdate(data: AugmentAction<LobbyActions.QUEUE_UPDATE>): void {
    console.debug('Queue status updated:', data);
    
    // Note: QueueUpdate currently only contains inQueue status
    // Player count tracking would require server-side changes to include count in packet
  }

  private handleMatchFound(data: AugmentAction<LobbyActions.MATCH_FOUND>): void {
    console.debug('Match found:', data);

    if (this.matchmakingService) {
      this.matchmakingService.setMatchInfo(data.myID, data.players);
    }

    // Navigate to duel demo view
    if (this.viewStateService) {
      this.viewStateService.navigateToView(AppView.DUEL_DEMO);
    }
  }
}
