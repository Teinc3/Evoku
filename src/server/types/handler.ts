import type SessionModel from "../models/Session";
import ActionEnum from "@shared/types/enums/actions";
import ActionMap from "@shared/types/actionmap";


export default interface IDataHandler {
    packetMap: {
        [key in ActionEnum]?: HandleDataFn<key>;
    };
    handleData: HandleDataFn<ActionEnum>;
}

export type HandleDataFn<GenericAction extends ActionEnum> 
    = (session: SessionModel, data: ActionMap[GenericAction]) => void;