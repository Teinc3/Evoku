import type ProtocolActions from "../../enums/actions/match/protocol";
import type { PingContract, PongContract } from "../../contracts/match/protocol/PingPongContract";
import type RejectActionContract from "../../contracts/match/protocol/RejectActionContract";


export default interface ProtocolActionMap {
    [ProtocolActions.PING]: PingContract;
    [ProtocolActions.PONG]: PongContract;
    [ProtocolActions.REJECT_ACTION]: RejectActionContract
}