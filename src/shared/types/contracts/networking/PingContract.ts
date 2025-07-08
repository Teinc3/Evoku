import { Networking } from "../ActionType";


import type IDataContract from "../IDataContract";


export default interface PingContract extends IDataContract {
    action: Networking.PING;
    timestamp: number;
}