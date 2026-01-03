export interface BoardAccessContext {
  selected(): number | null;
  getCellValue(cellIndex: number): number | null;
}

export type PupSlotShakeContext = (slotIndex: number) => void;
