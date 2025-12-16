import { LunaUnload, Tracer } from "@luna/core";
import { redux } from "@luna/lib";
import { settings } from "./settings";

export const { trace } = Tracer("[QoL]");
export const unloads = new Set<LunaUnload>();
export { Settings } from "./settings";

redux.intercept("player/SET_AVAILABLE_DEVICES", unloads, (payload: any) => {
    if (settings.controllableVolume) {
        redux.actions["player/SET_AVAILABLE_DEVICES"](payload.map((device: any) => ({
            ...device,
            controllableVolume: true
        })));
        return true;
    }
});