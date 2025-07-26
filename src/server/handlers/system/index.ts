import { isLobbyActionsData, isSessionActionsData } from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../UnionHandler";

import type IDataHandler from "src/server/types/handler";
import type { SomeHandlerMapEntry } from "src/server/types/handler";
import type SessionActions from "@shared/types/enums/actions/system/session";
import type LobbyActions from "@shared/types/enums/actions/system/lobby";
import type SystemActions from "@shared/types/enums/actions/system";


export default class SystemHandler extends UnionHandler<SystemActions> {
  constructor(
    sessionHandler: IDataHandler<SessionActions>,
    lobbyHandler: IDataHandler<LobbyActions>
  ) {
    super([
      [isSessionActionsData, sessionHandler],
      [isLobbyActionsData, lobbyHandler]
    ] as SomeHandlerMapEntry<SystemActions>[]);
  }
}