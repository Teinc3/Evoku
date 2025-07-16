import type Networking from "../enums/networking";
import type PingContract from "../contracts/networking/PingContract";
import type PongContract from "../contracts/networking/PongContract";


export default interface NetworkingActionMap {
    [Networking.PING]: PingContract;
    [Networking.PONG]: PongContract;
}
