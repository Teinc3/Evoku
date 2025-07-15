import type MetalPUP from "@shared/types/enums/mechanics/powerups/metal";
import type PUPBaseContract from "../PUPContract";


export default interface ForgeBaseContract extends PUPBaseContract {
    action: MetalPUP.FORGE;
}