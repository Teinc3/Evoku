// Might move some of these enums to a different folder structure
// depending on the number of enums and categories we end up with.

export enum Networking {
    PING,
    PONG
}

export enum GameAction {}


type ActionType = Networking | GameAction;

export default ActionType;