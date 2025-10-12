import type { z } from 'zod';
import type ClientConfigSchema from './schema';


type ClientConfigType = z.infer<typeof ClientConfigSchema>;
export default ClientConfigType;

/** Deep partial for override files */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export type DeepPartialClientConfigType = DeepPartial<ClientConfigType>;