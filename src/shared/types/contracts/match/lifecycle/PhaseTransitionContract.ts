import type IDataContract from "../../components/base/IDataContract";


export default interface PhaseTransitionContract extends IDataContract {
  newPhase: number;
}
