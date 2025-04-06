import { _default, importNative } from "./helpers/imports.native";

// const RepeatModeEnum: Promise<Record<string, string>> = importNative("../original.asar/app/shared/playback/RepeatModeEnum.js").then(_default);
// const clientDispatcher: Promise<Record<string, string>> = importNative("../original.asar/app/main/client/clientDispatcher.js").then(_default);

export const ClientMessageChannelEnum: Promise<Record<string, string>> = importNative("../original.asar/app/shared/client/ClientMessageChannelEnum.js").then(_default);
