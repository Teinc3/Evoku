import type IDataContract from "../contracts/base/IDataContract";
import type { ActionContractS2C, ActionContractC2S } from "../contracts/base/ActionContract";
import type ValueContract from "../contracts/extendables/ValueContract";
import type CellIndexContract from "../contracts/extendables/CellIndexContract";
import type PUPBaseContract from "../contracts/mechanics/powerups/PUPContract";
import type TargetContract from "../contracts/extendables/TargetContract";
import type { CodecConstructor } from "../networking/ICodec";


export type AllExtendableContracts = ActionContractS2C | ActionContractC2S | ValueContract | CellIndexContract | PUPBaseContract | TargetContract;

export type KeysToOmitMap<GenericContract extends IDataContract> = {
    [K in AllExtendableContracts as GenericContract extends K ? keyof K : never]: never
};

export type ExtendableContractKeys = KeysToOmitMap<AllExtendableContracts>;

// Merge all of these omitted types together into one single unified type
export type OmitExtendableFields<GenericContract extends IDataContract> = Omit<GenericContract, keyof KeysToOmitMap<GenericContract>>;

export type RequiredInjectableKeys<T> = Extract<keyof T, keyof ExtendableContractKeys>;

export type IsSameKeySet<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

export type HasDuplicates<T extends readonly any[]> = T extends readonly [infer Head, ...infer Tail] ? Head extends Tail[number] ? true : HasDuplicates<Tail> : false;

export type InjectableCodecMap = {
    [K in keyof ExtendableContractKeys]: CodecConstructor<any>
};