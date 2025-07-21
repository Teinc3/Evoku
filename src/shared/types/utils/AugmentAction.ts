import type ActionEnum from "../enums/actions";
import type ActionMap from "../actionmap"


type AugmentAction<GenericAction extends ActionEnum> = ActionMap[GenericAction] & {
    action: GenericAction;
};

export default AugmentAction;