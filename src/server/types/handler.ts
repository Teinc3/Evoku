import type AugmentAction from "@shared/types/utils/AugmentAction";
import type ActionEnum from "@shared/types/enums/actions";
import type SessionModel from "../models/Session";


export default interface IDataHandler<GenericActionOrType extends ActionEnum> {
  handleData: HandleDataFn<GenericActionOrType>;
}

export type HandleDataFn<GenericAction extends ActionEnum> 
  = (session: SessionModel, data: AugmentAction<GenericAction>) => boolean;

export type HandlerMap<T extends ActionEnum> = {
  [K in T]?: HandleDataFn<K>;
};

// Define a type for the pair: a type guard and the handler it maps to.
export type HandlerMapEntry<ParentType extends ActionEnum, ChildType extends ParentType> = [
  (packet: AugmentAction<ParentType>) => packet is AugmentAction<ChildType>,
  IDataHandler<ChildType>
];

/**
 * Creates a union of all possible HandlerMapEntry types for a given ParentType.
 * This is used to correctly type the handlerMap in UnionHandler.
 */
export type SomeHandlerMapEntry<ParentType extends ActionEnum> = {
  [ChildType in ParentType]: HandlerMapEntry<ParentType, ChildType>;
}[ParentType];