import type IExtendableContract from "../base/IExtendableContract";


/**
 * An extendible interface containing the targetID attribute.
 */
export default interface TargetContract extends IExtendableContract {
  targetID: number;
}
