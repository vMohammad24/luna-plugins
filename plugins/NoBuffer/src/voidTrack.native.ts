import type { PlaybackInfo } from "@inrixia/lib";
import { requestTrackStream } from "@inrixia/lib.native";
import { Writable } from "stream";

const VoidWriable = new Writable({ write: (_, __, cb) => cb() });
export const voidTrack = async (playbackInfo: PlaybackInfo): Promise<void> => {
	const stream = await requestTrackStream(playbackInfo);
	return new Promise((res) => stream.pipe(VoidWriable).on("end", res));
};
