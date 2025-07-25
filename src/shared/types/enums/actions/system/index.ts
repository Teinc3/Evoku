import type SessionActions from "./session";
import type LobbyActions from "./lobby";


type SystemActions = SessionActions | LobbyActions;

export default SystemActions;