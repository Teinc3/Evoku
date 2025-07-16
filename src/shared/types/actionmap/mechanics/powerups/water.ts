import type WaterPUP from "../../../enums/mechanics/powerups/water";
import type { CryoContractC2S, CryoContractS2C } from "../../../contracts/mechanics/powerups/water/CryoContract";
import type { CascadeContractC2S, CascadeContractS2C } from "../../../contracts/mechanics/powerups/water/CascadeContract";

export default interface WaterPUPActionMap {
    [WaterPUP.USE_CRYO]: CryoContractC2S;
    [WaterPUP.CRYO_USED]: CryoContractS2C;
    [WaterPUP.USE_CASCADE]: CascadeContractC2S;
    [WaterPUP.CASCADE_USED]: CascadeContractS2C;
}