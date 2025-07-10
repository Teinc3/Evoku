import type { Networking } from "../ActionType";
import type IDataContract from "../IDataContract";


export default interface PongContract extends IDataContract {
    action: Networking.PONG;
    serverTime: number;
    clientPing: number;
}