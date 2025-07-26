import Gameplay from "@shared/types/enums/actions/mechanics/gameplay";
import DataHandler from ".";
import SessionModel from "../models/Session";


export default class RoomDataHandler extends DataHandler {
    
    constructor() {
        super();
        this.packetMap = {
            [Gameplay.SET_CELL]: this.handleSetCell,
            // Add other Gameplay actions here as needed
        };

        // Bind the packetMap handlers to the current instance
        for (const [action, handlerFn] of Object.entries(this.packetMap)) {
            this.packetMap[action as keyof (this.packetMap)] = handlerFn.bind(this);
        }
        this.handleData = this.handleGameplayData.bind(this);
    }


    handleSetCell(session: SessionModel, data: Gameplay.SET_CELL): void {
        // Handle the SET_CELL action
        // This is where you would implement the logic for setting a cell in the game
        console.log(`Setting cell for session ${session.id} with data:`, data);
        // Example logic could be to update the game state, notify other players, etc.
    }
}