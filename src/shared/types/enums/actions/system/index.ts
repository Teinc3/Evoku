import type SessionActions from "./session";
import type LobbyActions from "./lobby";


type SystemActions = SessionActions | LobbyActions;

export type { SystemActions as default, SystemActions }

export { default as LobbyActions } from "./lobby";
export { default as SessionActions } from "./session";
