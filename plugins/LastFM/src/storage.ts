import { getStorage } from "@inrixia/lib";
import type { LastFmSession } from "./LastFM";

export default getStorage<{
	lastFmSession?: LastFmSession;
}>({
	lastFmSession: undefined,
});
