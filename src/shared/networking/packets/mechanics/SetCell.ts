import createActionPacket from "../factory/createActionPacket";
import MechanicsActions from "../../../types/enums/actions/match/player/mechanics";


export const SetCell = createActionPacket(
  MechanicsActions.SET_CELL,
  ['clientTime', 'actionID', 'cellIndex', 'value'],
  {}
);

export const CellSet = createActionPacket(
  MechanicsActions.CELL_SET,
  ['serverTime', 'playerID', 'actionID', 'cellIndex', 'value'],
  {}
);