export { type Manifest as DashManifest } from "dasha";
import { parse } from "dasha";
export type DashaParseArgs = Parameters<typeof parse>;
const serialize = (val: any) => JSON.parse(JSON.stringify(val));
export const parseDasha = async (...args: DashaParseArgs) => serialize(await parse(...args));
