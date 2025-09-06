import { isLobbyActionsData, isSessionActionsData } from "@shared/types/utils/typeguards/actions";
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
      [isSessionActionsData, sessionHandler],
      [isLobbyActionsData, lobbyHandler]
    ] as SomeClientHandlerMapEntry<SystemActions>[]);
  }
}
