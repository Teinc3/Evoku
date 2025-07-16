import type IDataContract from "@shared/types/contracts/base/IDataContract";


export default interface PongContract extends IDataContract {
    serverTime: number;
    clientPing: number;
}