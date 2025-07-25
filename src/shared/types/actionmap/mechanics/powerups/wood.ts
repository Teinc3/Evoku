import type WoodPUP from "../../../enums/actions/match/player/powerups/wood";
import type { 
  WisdomContractC2S, WisdomContractS2C 
} from "../../../contracts/mechanics/powerups/wood/WisdomContract";
import type { 
  EntangleContractC2S, EntangleContractS2C 
} from "../../../contracts/mechanics/powerups/wood/EntangleContract";


export default interface WoodPUPActionMap {
  [WoodPUP.USE_WISDOM]: WisdomContractC2S;
  [WoodPUP.WISDOM_USED]: WisdomContractS2C;
  [WoodPUP.USE_ENTANGLE]: EntangleContractC2S;
  [WoodPUP.ENTANGLE_USED]: EntangleContractS2C;
}