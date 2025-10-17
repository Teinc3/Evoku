import { z } from 'zod';


export const ServerConfigSchema = z.object({
  networking: z.object({
    port: z.number().int().min(1, 'port 0 reserved for base config').max(65535),
  }),
  redis: z.object({
    pingInterval: z.number().int().min(0).max(1E5)
  })
}).strict();

type ServerConfigType = z.infer<typeof ServerConfigSchema>;
export default ServerConfigType;