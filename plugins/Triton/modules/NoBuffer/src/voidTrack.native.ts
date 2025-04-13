import type { PlaybackInfo } from "@triton/lib";
import { requestTrackStream } from "@triton/lib.native";
import { Writable } from "stream";

const VoidWriable = new Writable({ write: (_, __, cb) => cb() });
export const voidTrack = async (playbackInfo: PlaybackInfo): Promise<void> => {
	const stream = await requestTrackStream(playbackInfo);
	return new Promise((res) => stream.pipe(VoidWriable).on("end", res));
};
