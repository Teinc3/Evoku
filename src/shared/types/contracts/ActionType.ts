// Might move some of these enums to a different folder structure
// depending on the number of enums and categories we end up with.

export enum Networking {
    PING,
    PONG
}

export enum Mechanics {
    SETCELL,
}

export enum PUPActions {

}


type ActionType = Networking | Mechanics | PUPActions;

export default ActionType;