import type IDataContract from "../base/IDataContract";


export default interface PingContract extends IDataContract {
    clientTime: number;
    serverTime: number;
}