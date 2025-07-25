import type SessionActionMap from "./session";
import type LobbyActionMap from "./lobby";


export default interface SystemActionMap extends LobbyActionMap, SessionActionMap {}