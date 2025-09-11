import type AugmentAction from "@shared/types/utils/AugmentAction";
import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';


export type ActionHandler<GenericAction extends ActionEnum>
  = (data: ActionMap[GenericAction]) => void;


export default interface IClientDataHandler<GenericActionOrType extends ActionEnum> {
  handleData: ClientHandleDataFn<GenericActionOrType>;
}

export type ClientHandleDataFn<GenericAction extends ActionEnum> 
  = (data: AugmentAction<GenericAction>) => void;

export type ClientHandlerMap<GenericAction extends ActionEnum> = {
  [ActionKey in GenericAction]?: ClientHandleDataFn<ActionKey>;
};

// Define a type for the pair: a type guard and the handler it maps to.
export type ClientHandlerMapEntry<ParentType extends ActionEnum, ChildType extends ParentType> = [
  (packet: AugmentAction<ParentType>) => packet is AugmentAction<ChildType>,
  IClientDataHandler<ChildType>
];

/**
 * Creates a union of all possible ClientHandlerMapEntry types for a given ParentType.
 * This is used to correctly type the handlerMap in ClientUnionHandler.
 */
export type SomeClientHandlerMapEntry<ParentType extends ActionEnum> = {
  [ChildType in ParentType]: ClientHandlerMapEntry<ParentType, ChildType>;
}[ParentType];
