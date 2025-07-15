import type WaterPUP from "@shared/types/enums/mechanics/powerups/water";
import type PUPBaseContract from "../PUPContract";


export default interface CascadeBaseContract extends PUPBaseContract {
    action: WaterPUP.CASCADE;
}