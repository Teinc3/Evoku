import type WoodPUP from "@shared/types/enums/mechanics/powerups/wood";
import type PUPBaseContract from "../PUPContract";


export default interface EntangleBaseContract extends PUPBaseContract {
    action: WoodPUP.ENTANGLE;
}