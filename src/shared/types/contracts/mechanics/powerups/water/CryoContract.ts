import type WaterPUP from "@shared/types/enums/mechanics/powerups/water";
import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../extendables/CellIndexContract";


export default interface CryoBaseContract extends PUPBaseContract, CellIndexContract {
    action: WaterPUP.CRYO;
}