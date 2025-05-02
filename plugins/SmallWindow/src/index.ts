import type { LunaUnload } from "@luna/core";
import { removeLimits, restoreLimits } from "./size.native";

removeLimits();
export const unloads = new Set<LunaUnload>();
unloads.add(restoreLimits);
