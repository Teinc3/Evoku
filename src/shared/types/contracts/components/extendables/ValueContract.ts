import type IExtendableContract from "../base/IExtendableContract";


/**
 * An extendible interface for any contract with a value attribute.
 */
export default interface ValueContract extends IExtendableContract {
  value: number;
}
