import type ProtocolActions from "../../enums/actions/match/protocol";
import type {
  UpdateProgressContract, RejectActionContract,
  PingContract, PongContract
} from "../../contracts";


export default interface ProtocolActionMap {
  [ProtocolActions.PING]: PingContract;
  [ProtocolActions.PONG]: PongContract;
  [ProtocolActions.REJECT_ACTION]: RejectActionContract;
  [ProtocolActions.UPDATE_PROGRESS]: UpdateProgressContract;
}
