import type IDataContract from "../IDataContract";


export default interface PingContract extends IDataContract {
    clientTime: number;
    serverTime: number;
}