import type SessionActions from "../../enums/actions/system/session";
import type { HeartbeatContract, AuthContract } from "../../contracts/system/session";


export default interface SessionActionMap {
  [SessionActions.HEARTBEAT]: HeartbeatContract
  [SessionActions.AUTH]: AuthContract
}
