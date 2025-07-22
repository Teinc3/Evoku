/* eslint-disable @typescript-eslint/no-explicit-any */

import type { CodecConstructor } from "../networking/ICodec";
import type IDataContract from "../contracts/IDataContract";
import type ValueContract from "../contracts/extendables/ValueContract";
import type TargetContract from "../contracts/extendables/TargetContract";
import type PUPContract from "../contracts/extendables/PUPContract";
import type CellIndexContract from "../contracts/extendables/CellIndexContract";
import type { ActionContractS2C, ActionContractC2S } from "../contracts/extendables/ActionContract";


export type AllExtendableContracts
  = ActionContractS2C | ActionContractC2S
  | ValueContract | CellIndexContract 
  | PUPContract | TargetContract;

export type KeysToOmitMap<GenericContract extends IDataContract> = {
  [K in AllExtendableContracts as GenericContract extends K ? keyof K : never]: never
};

export type ExtendableContractKeys = KeysToOmitMap<AllExtendableContracts>;

export type RequiredInjectableKeys<T> = Extract<keyof T, keyof ExtendableContractKeys>;

export type InjectableCodecMap = {
  [K in keyof ExtendableContractKeys]: CodecConstructor<any>
};

// collects any duplicate entries in a readonly tuple T
export type DuplicateKeys<
  T extends readonly unknown[],
  Seen = never
> = T extends readonly [infer Head, ...infer Tail]
  ? Head extends Seen
    ? Head | DuplicateKeys<Tail, Seen>
    : DuplicateKeys<Tail, Seen | Head>
  : never;

// validate that Keys[] is exactly the Required set, no extras, no misses, no dupes.
// if it is, yields Keys itself; otherwise yields an object literal showing
// missing ∪ extra ∪ duplicates.
export type ValidateInclude<
  Keys extends readonly PropertyKey[],
  Required extends PropertyKey
> = {
  missing: Exclude<Required, Keys[number]>;
  extra: Exclude<Keys[number], Required>;
  duplicates: DuplicateKeys<Keys>;
} extends { missing: never; extra: never; duplicates: never }
  ? Keys
  : {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "Error: invalid `include`": {
      missing: Exclude<Required, Keys[number]>;
      extra: Exclude<Keys[number], Required>;
      duplicates: DuplicateKeys<Keys>;
    };
  };
