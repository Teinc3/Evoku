import type Networking from "../enums/networking";
import type { PingContract, PongContract } from "../contracts/networking/PingPongContract";


export default interface NetworkingActionMap {
    [Networking.PING]: PingContract;
    [Networking.PONG]: PongContract;
}
