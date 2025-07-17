import type IDataContract from "../base/IDataContract";


export default interface PongContract extends IDataContract {
    serverTime: number;
    clientPing: number;
}