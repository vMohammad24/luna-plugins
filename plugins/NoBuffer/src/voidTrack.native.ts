import type { PlaybackInfo } from "@luna/lib";
import { fetchMediaItemStream } from "@luna/lib.native";
import { Writable } from "stream";

const VoidWriable = new Writable({ write: (_, __, cb) => cb() });
export const voidTrack = async (playbackInfo: PlaybackInfo): Promise<void> => {
	const stream = await fetchMediaItemStream(playbackInfo);
	return new Promise((res) => stream.pipe(VoidWriable).on("end", res));
};
