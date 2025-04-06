import { constants, createWriteStream, type PathLike } from "fs";
import { access, mkdir } from "fs/promises";
import path from "path";
import { rejectNotOk, toBuffer, type DownloadProgress } from "./request/helpers.native";
import { requestTrackStream } from "./request/requestTrack.native";

import { FlacStreamTagger, PictureType } from "flac-stream-tagger";
import { requestStream } from "./request/requestStream.native";

import { type MetaTags, type PlaybackInfo } from "@inrixia/lib";

import type { Readable } from "stream";
export type { DownloadProgress } from "./request/helpers.native";

const addTags = async ({ manifestMimeType, manifest }: PlaybackInfo, stream: Readable, metaTags: MetaTags) => {
	const { tags, coverUrl } = metaTags;
	if (manifestMimeType === "application/vnd.tidal.bts") {
		switch (manifest.codecs) {
			case "flac": {
				let picture;
				if (coverUrl !== undefined) {
					try {
						picture = {
							pictureType: PictureType.FrontCover,
							buffer: await requestStream(coverUrl).then(rejectNotOk).then(toBuffer),
						};
					} catch {}
				}
				return stream.pipe(
					new FlacStreamTagger({
						tagMap: tags,
						picture,
					})
				);
			}
		}
	}
	return stream;
};
export type PathInfo = {
	fileName?: string;
	folderPath: string;
	basePath?: string;
};

const exists = (path: PathLike) =>
	access(path, constants.F_OK)
		.then(() => true)
		.catch(() => false);

const pathSeparator = process.platform === "win32" ? "\\" : "/";

const downloadStatus: Record<string, DownloadProgress> = {};
export const startTrackDownload = async (playbackInfo: PlaybackInfo, pathInfo: PathInfo, metaTags?: MetaTags): Promise<void> => {
	const pathKey = JSON.stringify(pathInfo);
	if (downloadStatus[pathKey] !== undefined) throw new Error(`Something is already downloading to ${pathKey}`);
	try {
		const folderPath = path.join(pathInfo.basePath ?? "", pathInfo.folderPath);
		if (folderPath !== ".") await mkdir(folderPath, { recursive: true });
		const fileName = `${folderPath}${pathSeparator}${pathInfo.fileName}`;
		// Dont download if exists
		if (await exists(fileName)) {
			delete downloadStatus[pathKey];
			return Promise.resolve();
		}
		let stream = await requestTrackStream(playbackInfo, { onProgress: (progress) => (downloadStatus[pathKey] = progress) });
		if (metaTags) stream = await addTags(playbackInfo, stream, metaTags);
		const writeStream = createWriteStream(fileName);
		return new Promise((res, rej) =>
			stream
				.pipe(writeStream)
				.on("finish", () => {
					delete downloadStatus[pathKey];
					res();
				})
				.on("error", rej)
		);
	} catch (err) {
		delete downloadStatus[pathKey];
		throw err;
	}
};
export const getDownloadProgress = (filePath: string) => downloadStatus[filePath];
