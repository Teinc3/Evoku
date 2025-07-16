import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";


export default interface WisdomBaseContract extends PUPBaseContract {}

// Wisdom is an rCell (can be rAOE in the future) powerup
export interface WisdomContractC2S extends WisdomBaseContract {}
export interface WisdomContractS2C extends WisdomBaseContract, CellIndexContract {}