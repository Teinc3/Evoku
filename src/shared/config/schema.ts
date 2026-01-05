import { z } from 'zod';


export const SharedConfigSchema = z.object({
  game: z.object({
    cooldown: z.object({
      board: z.array(z.number().int().nonnegative()).length(3),
      cell: z.number().int().nonnegative(),
    }),
    powerups: z.object({
      drawSettleDelayMs: z.number().int().nonnegative(),
    }),
    objectives: z.object({
      normalGain: z.array(z.number().int().nonnegative()).length(3),
      goldenGain: z.array(z.number().int().nonnegative()).length(3),
    }),
    challenge: z.object({
      duration: z.array(z.number().int().nonnegative()).length(3),
    }),
  }),
  networking: z.object({
    ws: z.object({
      timeoutMs: z.number().int().nonnegative(),
      simulatedLatencyMs: z.number().int().nonnegative(),
    }),
    service: z.object({
      autoReconnect: z.boolean(),
      backoffMs: z.number().int().nonnegative(),
      backoffMaxMs: z.number().int().nonnegative(),
      pingIntervalMs: z.number().int().nonnegative(),
    }),
  }),
  security: z.object({
    packetScramblerSeed: z.string(),
  }),
  version: z.string().regex(
    /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/,
    'Must be a valid semantic version string'
  )
}).strict();

type SharedConfigType = z.infer<typeof SharedConfigSchema>;
export default SharedConfigType;
