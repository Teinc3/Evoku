import type IExtendableContract from "../IExtendableContract";


/**
 * An extendible interface containing the targetID attribute.
 */
export default interface TargetContract extends IExtendableContract {
  targetID: number;
}