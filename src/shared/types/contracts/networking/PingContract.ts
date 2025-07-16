import type IDataContract from "@shared/types/contracts/base/IDataContract";


export default interface PingContract extends IDataContract {
    clientTime: number;
    serverTime: number;
}