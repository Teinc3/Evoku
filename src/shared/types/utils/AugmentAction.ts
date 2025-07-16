import type ActionMap from "../actionmap";


type AugmentAction<Action extends keyof ActionMap> = ActionMap[Action] & {
    action: ActionMap[Action]["action"];
};

export default AugmentAction;