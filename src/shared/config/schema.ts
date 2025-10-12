import { z } from 'zod';


export const SharedConfigSchema = z.object({
  networking: z.object({
    ws: z.object({
      uri: z.string().url().nonempty(),
      timeoutMs: z.number().int().nonnegative(),
    }),
    service: z.object({
      autoReconnect: z.boolean(),
      backoffMs: z.number().int().nonnegative(),
      backoffMaxMs: z.number().int().nonnegative(),
      pingIntervalMs: z.number().int().nonnegative(),
    }),
  }),
  security: z.object({
    packetScramblerSeed: z.string().nonempty(),
  })
}).strict();

type SharedConfigType = z.infer<typeof SharedConfigSchema>;
export default SharedConfigType;