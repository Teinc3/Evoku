import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "@shared/types/contracts/base/ActionContract";

export default interface WisdomBaseContract extends PUPBaseContract {}

// Wisdom is an rCell (can be rAOE in the future) powerup
export interface WisdomContractC2S extends WisdomBaseContract, ActionContractC2S {}
export interface WisdomContractS2C extends WisdomBaseContract, CellIndexContract, ActionContractS2C {}