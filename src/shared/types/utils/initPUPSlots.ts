import type { IPUPSlotState } from "../gamestate/powerups";


export default function initPUPSlots(): readonly [IPUPSlotState, IPUPSlotState, IPUPSlotState] {
  return [
    { slotIndex: 0, lastCooldownEnd: 0, locked: false },
    { slotIndex: 1, lastCooldownEnd: 0, locked: false },
    { slotIndex: 2, lastCooldownEnd: 0, locked: false },
  ];
}
