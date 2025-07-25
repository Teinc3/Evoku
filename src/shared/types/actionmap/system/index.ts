import type LobbyActionMap from "./lobby";
import type SessionActionMap from "./session";


export default interface SystemActionMap extends LobbyActionMap, SessionActionMap {}