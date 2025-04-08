import { createHash, type Encoding, type HashOptions, type BinaryToTextEncoding } from "crypto";

export const hash = (
	data: string,
	options: {
		algorithm?: string;
		hashOptions?: HashOptions;
		inputEncoding?: Encoding;
		digestEncoding?: BinaryToTextEncoding;
	} = {}
) => {
	options.algorithm ??= "md5";
	options.inputEncoding ??= "utf8";
	options.digestEncoding ??= "hex";
	return createHash(options.algorithm).update(data, options.inputEncoding).digest(options.digestEncoding);
};
