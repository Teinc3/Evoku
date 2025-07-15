import type WoodPUP from "@shared/types/enums/mechanics/powerups/wood";
import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../extendables/CellIndexContract";


export default interface WisdomBaseContract extends PUPBaseContract {
    action: WoodPUP.WISDOM;
}

// Wisdom is an rCell (can be rAOE in the future) powerup
export interface WisdomContractS2C extends WisdomBaseContract, CellIndexContract {}