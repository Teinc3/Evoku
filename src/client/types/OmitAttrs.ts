import IDataContract from "@shared/types/contracts/components/base/IDataContract";

import type { ActionContractC2S, ActionContractS2C }
  from "@shared/types/contracts/components/extendables/ActionContract";
import type { DistributiveOmit } from "./utils";


export type OmitC2SAttrs<GenericContract extends IDataContract>
  = DistributiveOmit<GenericContract, keyof ActionContractC2S>;
export type OmitS2CAttrs<GenericContract extends IDataContract>
  = DistributiveOmit<GenericContract, keyof ActionContractS2C>;

export type OmitBaseAttrs<GenericContract extends IDataContract>
  = OmitC2SAttrs<OmitS2CAttrs<GenericContract>>;
