import ActionGuard from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../UnionHandler";
import SessionHandler from "./SessionHandler";
import LobbyHandler from "./LobbyHandler";

import type SystemActions from "@shared/types/enums/actions/system";
import type { SomeClientHandlerMapEntry } from "../../../types/networking";


export default class SystemHandler extends UnionHandler<SystemActions> {
  constructor() {
    const sessionHandler = new SessionHandler();
    const lobbyHandler = new LobbyHandler();

    super([
      [ActionGuard.isSessionActionsData, sessionHandler],
      [ActionGuard.isLobbyActionsData, lobbyHandler]
    ] as SomeClientHandlerMapEntry<SystemActions>[]);
  }
}
