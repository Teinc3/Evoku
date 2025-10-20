import type IDataContract from "../../components/base/IDataContract";


export default interface AuthContract extends IDataContract {
  token: string;
  version: string;
}
