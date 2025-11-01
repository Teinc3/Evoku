import ActionGuard from "@shared/types/utils/typeguards/actions";
import UnionHandler from "./UnionHandler";
import SystemHandler from "./system";
import MatchHandler from "./match";

import type ActionEnum from "@shared/types/enums/actions";
import type WebSocketService from "../services/WebSocketService";
import type { SomeClientHandlerMapEntry } from "../../types/networking";
import type MatchmakingService from "../../app/services/matchmaking.service";
import type ViewStateService from "../../app/services/view-state.service";


/**
 * Root packet handler for the client that routes all incoming packets
 * to the appropriate sub-handlers based on action type.
 */
export default class ClientPacketHandler extends UnionHandler<ActionEnum> {
  private systemHandler: SystemHandler;

  constructor(
    networkService: WebSocketService,
    matchmakingService?: MatchmakingService,
    viewStateService?: ViewStateService
  ) {
    const systemHandler = new SystemHandler(matchmakingService, viewStateService);
    const matchHandler = new MatchHandler(networkService);

    super([
      [ActionGuard.isSystemActionsData, systemHandler],
      [ActionGuard.isMatchActionsData, matchHandler]
    ] as SomeClientHandlerMapEntry<ActionEnum>[]);

    this.systemHandler = systemHandler;
  }

  /**
   * Set the matchmaking service instance
   */
  setMatchmakingService(service: MatchmakingService): void {
    this.systemHandler.setMatchmakingService(service);
  }

  /**
   * Set the view state service instance
   */
  setViewStateService(service: ViewStateService): void {
    this.systemHandler.setViewStateService(service);
  }
}
