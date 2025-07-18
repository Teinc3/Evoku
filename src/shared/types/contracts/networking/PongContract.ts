import type IDataContract from "../IDataContract";


export default interface PongContract extends IDataContract {
    serverTime: number;
    clientPing: number;
}