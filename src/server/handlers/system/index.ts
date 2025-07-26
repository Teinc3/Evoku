import { isLobbyActionsData, isSessionActionsData } from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../UnionHandler";
import SessionHandler from "./SessionHandler";
import LobbyHandler from "./LobbyHandler";

import type { SomeHandlerMapEntry } from "src/server/types/handler";
import type SystemActions from "@shared/types/enums/actions/system";


export default class SystemHandler extends UnionHandler<SystemActions> {
  constructor() {
    const sessionHandler = new SessionHandler()
    const lobbyHandler = new LobbyHandler();

    super([
      [isSessionActionsData, sessionHandler],
      [isLobbyActionsData, lobbyHandler]
    ] as SomeHandlerMapEntry<SystemActions>[]);
  }
}