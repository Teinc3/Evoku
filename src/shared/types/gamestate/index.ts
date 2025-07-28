export default interface PlayerState {
  playerID: number;
  gameState?: GameState;
  syncState?: SyncState;
}

export interface GameState {
  boardState: BoardState;
  pupProgress: number;
  powerups: Array<PUPState>;
}

export interface BoardState {
  globalCellCooldown: number;
  board: CellState[];
}

export interface CellState {
  cellIndex: number; // Might not be necessary
  value: number;
  fixed: boolean; // Whether the cell is fixed or not (prefilled)
  // effects: ICellEffect[];
  // cellCooldown: number;
}

export interface PUPState {
  type: number; // For now number
  // level: number; // No level for now
}

/**
 * Represents the synchronization state of a player's in-game timer
 * Not implemented for now.
 */
export interface SyncState {
  
}