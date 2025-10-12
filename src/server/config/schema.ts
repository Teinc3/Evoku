import { z } from 'zod';


export const ServerConfigSchema = z.object({
  networking: z.object({
    port: z.number().int().min(1, '0 reserved for base').max(65535),
  }),
}).strict();

type ServerConfigType = z.infer<typeof ServerConfigSchema>;
export default ServerConfigType;