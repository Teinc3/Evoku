import ActionGuard from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../UnionHandler";
import SessionHandler from "./SessionHandler";
import LobbyHandler from "./LobbyHandler";

import type SystemActions from "@shared/types/enums/actions/system";
import type { SomeClientHandlerMapEntry } from "../../../types/networking";
import type MatchmakingService from "../../../app/services/matchmaking.service";
import type ViewStateService from "../../../app/services/view-state.service";


export default class SystemHandler extends UnionHandler<SystemActions> {
  private lobbyHandler: LobbyHandler;

  constructor(
    matchmakingService?: MatchmakingService,
    viewStateService?: ViewStateService
  ) {
    const sessionHandler = new SessionHandler();
    const lobbyHandler = new LobbyHandler();

    if (matchmakingService) {
      lobbyHandler.setMatchmakingService(matchmakingService);
    }
    if (viewStateService) {
      lobbyHandler.setViewStateService(viewStateService);
    }

    super([
      [ActionGuard.isSessionActionsData, sessionHandler],
      [ActionGuard.isLobbyActionsData, lobbyHandler]
    ] as SomeClientHandlerMapEntry<SystemActions>[]);

    this.lobbyHandler = lobbyHandler;
  }

  /**
   * Set the matchmaking service instance
   */
  setMatchmakingService(service: MatchmakingService): void {
    this.lobbyHandler.setMatchmakingService(service);
  }

  /**
   * Set the view state service instance
   */
  setViewStateService(service: ViewStateService): void {
    this.lobbyHandler.setViewStateService(service);
  }
}
