import PUPElements from "@shared/types/enums/elements";
import { ProtocolActions, MechanicsActions } from "@shared/types/enums/actions";
import sharedConfig from "@shared/config";
import pupConfig from "@config/shared/pup.json";
import EnumHandler from "../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type { IMatchEnumHandler } from "../../../types/handler";
import type { RoomModel } from "../../../models/networking";
import type { SessionModel } from "../../../models/networking";


export default class MechanicsHandler extends EnumHandler<MechanicsActions>
  implements IMatchEnumHandler<MechanicsActions> {

  constructor(public readonly room: RoomModel) {
    super();

    const handlerMap = {
      [MechanicsActions.SET_CELL]: this.handleSetCell,
      [MechanicsActions.DRAW_PUP]: this.handleDrawPUP
    };

    this.setHandlerMap(handlerMap);
  }

  private handleSetCell(
    session: SessionModel,
    data: AugmentAction<MechanicsActions.SET_CELL>
  ): boolean {
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined) {
      return false;
    }

    // No need to extract clientTime field from payload - as CELL_SET packet won't encode it
    const { action: _, ...payload } = data;
    const { result, serverTime } = this.room.stateController.setCellValue(playerID, payload);

    // Broadcast
    if (result) {
      this.room.broadcast(MechanicsActions.CELL_SET, {
        serverTime: serverTime!,
        playerID,
        ...payload
      });
    } else {
      this.room.broadcast(
        ProtocolActions.REJECT_ACTION,
        {
          actionID: data.actionID,
          gameStateHash: this.room.stateController.computeHash()
        },
        { to: [session.uuid] }
      );

      // TODO: Log invalid action attempt, which will decide if disconnection is necessary
      // For now, just don't disconnect
    }

    return true;
  }

  private handleDrawPUP(
    session: SessionModel,
    _data: AugmentAction<MechanicsActions.DRAW_PUP>
  ): boolean {
    const playerID = this.room.getPlayerID(session);
    if (playerID === undefined) {
      return false;
    }

    const slotIndex = this.room.stateController.reservePUPDraw(playerID);
    if (slotIndex === -1) {
      return false;
    }

    let randomPUPType = Math.floor(Math.random() * pupConfig.length);
    // For debug we want YANG pup (so if Yin i.e. odd number, then -1 for even/yang PUP)
    if (process.env['DEBUG_START_PUP'] === 'true' && randomPUPType % 2 === 1) {
      randomPUPType -= 1;
    }
    const chosenPUPConfig = pupConfig[randomPUPType];
    const element = PUPElements[chosenPUPConfig.element.toUpperCase() as keyof typeof PUPElements];
    const pupType = chosenPUPConfig.type;

    this.room.broadcast(
      MechanicsActions.PUP_SPUN,
      {
        element,
        slotIndex
      },
      { to: [session.uuid] }
    );

    this.room.setTrackedTimeout(() => {
      const pupDrawn = this.room.stateController.drawRandomPUP(playerID, slotIndex, pupType);
      if (!pupDrawn) {
        return;
      }

      this.room.broadcast(MechanicsActions.PUP_DRAWN, {
        playerID,
        ...pupDrawn
      });
    }, sharedConfig.game.powerups.drawSettleDelayMs);

    return true;
  }
  
}
