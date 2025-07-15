import type BaseActionContract from "@shared/types/contracts/mechanics/ActionContract";
import type TargetContract from "../TargetContract";


/**
 * The base contract for all Power-Up (PUP) actions.
 * 
 * Can be used as a generic contract when creating an Action Packet for a PUP.
 */
export default interface PUPBaseContract extends BaseActionContract, TargetContract {
    pupID: number;
}