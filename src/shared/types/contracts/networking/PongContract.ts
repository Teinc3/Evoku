import type Networking from "@shared/types/enums/networking";
import type IDataContract from "@shared/types/contracts/base/IDataContract";


export default interface PongContract extends IDataContract {
    action: Networking.PONG;
    serverTime: number;
    clientPing: number;
}