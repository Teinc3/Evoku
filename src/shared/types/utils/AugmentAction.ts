import type ActionEnum from "../enums/ActionEnum";
import type ActionMap from "../actionmap"


type AugmentAction<GenericAction extends ActionEnum> = ActionMap[GenericAction] & {
    action: GenericAction;
};

export default AugmentAction;