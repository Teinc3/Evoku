import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type ValueContract from "../../../extendables/ValueContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../base/ActionContract";


export default interface WisdomBaseContract extends PUPBaseContract {}
// Wisdom is an rCell (can be rAOE in the future) powerup
// We obtain info of the value and index of the cell which clue was given.
export interface WisdomContractC2S extends WisdomBaseContract, ActionContractC2S {}
export interface WisdomContractS2C extends WisdomBaseContract, CellIndexContract, ValueContract, ActionContractS2C {}