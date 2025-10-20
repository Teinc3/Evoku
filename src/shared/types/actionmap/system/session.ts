import type SessionActions from "../../enums/actions/system/session";
import type HeartbeatContract from "../../contracts/system/session/HeartbeatContract";
import type AuthContract from "../../contracts/system/session/AuthContract";


export default interface SessionActionMap {
  [SessionActions.HEARTBEAT]: HeartbeatContract
  [SessionActions.AUTH]: AuthContract
}