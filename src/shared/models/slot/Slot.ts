import type { IPUPSlotState, IPUPState } from "../../types/gamestate/powerups";


export default class SlotModel implements IPUPSlotState {

  public diffuseType: number;
  public lastCooldownEnd: number;
  public pup?: IPUPState;

  constructor(
    diffuseType: number = 0,
    lastCooldownEnd: number = 0,
    pup?: IPUPState,
  ) {
    this.diffuseType = diffuseType;
    this.lastCooldownEnd = lastCooldownEnd;
    this.pup = pup;
  }
  
}
