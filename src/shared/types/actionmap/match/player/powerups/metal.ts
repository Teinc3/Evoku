import type MetalPUPActions from "../../../../enums/actions/match/player/powerups/metal";
import type {
  LockContractC2S, LockContractS2C
} from "../../../../contracts/match/player/powerups/metal";
import type {
  ForgeContractC2S, ForgeContractS2C
} from "../../../../contracts/match/player/powerups/metal";


export default interface MetalPUPActionMap {
  [MetalPUPActions.USE_LOCK]: LockContractC2S;
  [MetalPUPActions.LOCK_USED]: LockContractS2C;
  [MetalPUPActions.USE_FORGE]: ForgeContractC2S;
  [MetalPUPActions.FORGE_USED]: ForgeContractS2C;
}
