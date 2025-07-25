import type ProtocolActions from "../../enums/actions/match/protocol";
import type RejectActionContract from "../../contracts/match/protocol/RejectActionContract";
import type { PingContract, PongContract } from "../../contracts/match/protocol/PingPongContract";


export default interface ProtocolActionMap {
  [ProtocolActions.PING]: PingContract;
  [ProtocolActions.PONG]: PongContract;
  [ProtocolActions.REJECT_ACTION]: RejectActionContract
}