import type  Networking from "../../enums/networking";
import type IDataContract from "../IDataContract";


export default interface PingContract extends IDataContract {
    action: Networking.PING;
    clientTime: number;
    serverTime: number;
}