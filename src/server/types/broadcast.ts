import type { UUID } from "crypto";


export type BroadcastFilter = "all" | Array<UUID>; //| "players" | "spectators" 

type BroadcastOptions = Partial<{
  to: BroadcastFilter;
  exclude: Set<UUID>;
}>

export default BroadcastOptions;