import type BaseActionContract from "../extendables/ActionContract"


export default interface RejectActionContract extends BaseActionContract {
  /**
     * A hash of the board state at the time of rejection
     * to identify if the rejection is due to board states being out of sync.
     * The client will refresh the board if this hash does not match.
     */
  boardHash: number;
}