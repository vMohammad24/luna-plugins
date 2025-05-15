import { createHash } from "crypto";

/**
 * Returns the MD5 hash of the given string.
 * @param input The string to hash.
 * @returns The MD5 hash as a hex string.
 */
export const md5 = async (input: string): Promise<string> => createHash("md5").update(input).digest("hex");
