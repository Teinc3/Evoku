import type { ActionContractS2C, ActionContractC2S } from "../../../types/contracts/base/ActionContract";


export function isActionContractS2C(obj: Object): obj is ActionContractS2C {
    return typeof obj === "object" && obj !== null && "serverTime" in obj && "playerID" in obj && "moveID" in obj;
}

export function isActionContractC2S(obj: Object): obj is ActionContractC2S {
    return typeof obj === "object" && obj !== null && "clientTime" in obj && "moveID" in obj;
}