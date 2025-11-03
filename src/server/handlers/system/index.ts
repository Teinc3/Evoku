import ActionGuard from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../UnionHandler";
import SessionHandler from "./SessionHandler";
import LobbyHandler from "./LobbyHandler";

import type SystemActions from "@shared/types/enums/actions/system";
import type { SomeHandlerMapEntry } from "../../types/handler";
import type { MatchmakingManager } from "../../managers";


export default class SystemHandler extends UnionHandler<SystemActions> {
  private lobbyHandler: LobbyHandler;

  constructor() {
    const sessionHandler = new SessionHandler();
    const lobbyHandlerInstance = new LobbyHandler();

    super([
      [ActionGuard.isSessionActionsData, sessionHandler],
      [ActionGuard.isLobbyActionsData, lobbyHandlerInstance]
    ] as SomeHandlerMapEntry<SystemActions>[]);
    
    this.lobbyHandler = lobbyHandlerInstance;
  }

  public setMatchmakingManager(matchmakingManager: MatchmakingManager): void {
    this.lobbyHandler.setMatchmakingManager(matchmakingManager);
  }
}