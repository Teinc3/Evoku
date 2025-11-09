import type ProtocolActions from "../../enums/actions/match/protocol";
import type RejectActionContract from "../../contracts/match/protocol/RejectActionContract";
import type { PingContract, PongContract } from "../../contracts/match/protocol/PingPongContract";
import type BoardProgressContract from "../../contracts/match/protocol/BoardProgressContract";


export default interface ProtocolActionMap {
  [ProtocolActions.PING]: PingContract;
  [ProtocolActions.PONG]: PongContract;
  [ProtocolActions.REJECT_ACTION]: RejectActionContract;
  [ProtocolActions.BOARD_PROGRESS]: BoardProgressContract;
}
