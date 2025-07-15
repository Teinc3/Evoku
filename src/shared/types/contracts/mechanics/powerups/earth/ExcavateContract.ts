import type EarthPUP from "@shared/types/enums/mechanics/powerups/earth";
import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../extendables/CellIndexContract";


export default interface ExcavateBaseContract extends PUPBaseContract, CellIndexContract {
    action: EarthPUP.EXCAVATE;
}