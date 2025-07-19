import type MetalPUP from "../../../enums/actions/mechanics/powerups/metal";
import type { LockContractC2S, LockContractS2C } from "../../../contracts/mechanics/powerups/metal/LockContract";
import type { ForgeContractC2S, ForgeContractS2C } from "../../../contracts/mechanics/powerups/metal/ForgeContract";

export default interface MetalPUPActionMap {
    [MetalPUP.USE_LOCK]: LockContractC2S;
    [MetalPUP.LOCK_USED]: LockContractS2C;
    [MetalPUP.USE_FORGE]: ForgeContractC2S;
    [MetalPUP.FORGE_USED]: ForgeContractS2C;
}