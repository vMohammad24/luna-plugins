import type { Unload } from "@triton/lib";
import { removeLimits, restoreLimits } from "./size.native";

removeLimits();
export const unloads = new Set<Unload>();
unloads.add(restoreLimits);
