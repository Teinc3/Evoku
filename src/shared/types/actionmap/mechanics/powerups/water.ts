import type WaterPUP from "../../../enums/mechanics/powerups/water";
import type CascadeBaseContract from "../../../contracts/mechanics/powerups/water/CascadeContract";
import type CryoBaseContract from "../../../contracts/mechanics/powerups/water/CryoContract";


export default interface WaterPUPActionMap {
    [WaterPUP.CRYO]: CryoBaseContract;
    [WaterPUP.CASCADE]: CascadeBaseContract;
}