import type MetalPUP from "../../../enums/mechanics/powerups/metal";
import type LockBaseContract from "../../../contracts/mechanics/powerups/metal/LockContract";
import type ForgeBaseContract from "../../../contracts/mechanics/powerups/metal/ForgeContract";


export default interface MetalPUPActionMap {
    [MetalPUP.LOCK]: LockBaseContract;
    [MetalPUP.FORGE]: ForgeBaseContract;
}