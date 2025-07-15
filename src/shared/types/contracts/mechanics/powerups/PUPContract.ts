import type TargetContract from "../extendables/TargetContract";


/**
 * The base contract for all Power-Up (PUP) actions.
 * 
 * Can be used as a generic contract when creating an Action Packet for a PUP.
 */
export default interface PUPBaseContract extends TargetContract {
    pupID: number;
}