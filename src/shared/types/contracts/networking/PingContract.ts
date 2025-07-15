import type Networking from "@shared/types/enums/networking";
import type IDataContract from "@shared/types/contracts/base/IDataContract";


export default interface PingContract extends IDataContract {
    action: Networking.PING;
    clientTime: number;
    serverTime: number;
}