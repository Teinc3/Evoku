import type SessionActions from "../../enums/actions/system/session";
import type HeartbeatContract from "../../contracts/system/session/HeartbeatContract";


export default interface SessionActionMap {
    [SessionActions.HEARTBEAT]: HeartbeatContract
}