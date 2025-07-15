import type MetalPUP from "@shared/types/enums/mechanics/powerups/metal";
import type PUPBaseContract from "../PUPContract";


export default interface LockBaseContract extends PUPBaseContract {
    action: MetalPUP.LOCK;
    value: number;
}