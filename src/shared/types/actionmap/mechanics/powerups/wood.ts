import type WoodPUP from "../../../enums/mechanics/powerups/wood";
import type WisdomBaseContract from "../../../contracts/mechanics/powerups/wood/WisdomContract";
import type EntangleBaseContract from "../../../contracts/mechanics/powerups/wood/EntangleContract";


export default interface WoodPUPActionMap {
    [WoodPUP.WISDOM]: WisdomBaseContract;
    [WoodPUP.ENTANGLE]: EntangleBaseContract;
}