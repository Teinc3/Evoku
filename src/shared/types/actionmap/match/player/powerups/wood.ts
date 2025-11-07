import type WoodPUPActions from "../../../../enums/actions/match/player/powerups/wood";
import type {
  WisdomContractC2S, WisdomContractS2C
} from "../../../../contracts/match/player/powerups/wood";
import type {
  EntangleContractC2S, EntangleContractS2C
} from "../../../../contracts/match/player/powerups/wood";


export default interface WoodPUPActionMap {
  [WoodPUPActions.USE_WISDOM]: WisdomContractC2S;
  [WoodPUPActions.WISDOM_USED]: WisdomContractS2C;
  [WoodPUPActions.USE_ENTANGLE]: EntangleContractC2S;
  [WoodPUPActions.ENTANGLE_USED]: EntangleContractS2C;
}