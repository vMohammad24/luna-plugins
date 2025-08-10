import { LunaUnload, Tracer } from "@luna/core";
import "./index.native";
export { Settings } from "./settings";
export const { trace } = Tracer("[noTrack]");
export const unloads = new Set<LunaUnload>();

