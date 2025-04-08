// // Dont show MQA as a option as if HiRes is avalible itl always be served even if MQA is requested.
// export const validQualitiesSettings: PlaybackAudioQuality[] = [PlaybackAudioQuality.HiRes, PlaybackAudioQuality.High, PlaybackAudioQuality.Low, PlaybackAudioQuality.Lowest];

export type MediaMetadataTag = "LOSSLESS" | "SONY_360RA" | "DOLBY_ATMOS" | "HIRES_LOSSLESS" | "MQA";
export type MediaItemAudioQuality = "HI_RES_LOSSLESS" | "HI_RES" | "LOSSLESS" | "HIGH" | "LOW";

export class Quality {
	private static readonly idxLookup: Record<number, Quality> = {};
	private constructor(private readonly idx: number, public readonly name: string, public readonly color: string) {
		Quality.idxLookup[idx] = this;
	}
	public static readonly Lowest = new Quality(0, "Lowest", "#b9b9b9");
	public static readonly Low = new Quality(1, "Low", "#b9b9b9");
	public static readonly High = new Quality(2, "High", "#33FFEE");
	public static readonly Atmos = new Quality(3, "Atmos", "#6ab5ff");
	public static readonly Sony630 = new Quality(4, "Sony630", "#6ab5ff");
	public static readonly MQA = new Quality(5, "MQA", "#F9BA7A");
	public static readonly HiRes = new Quality(6, "HiRes", "#ffd432");

	public static readonly Max = Quality.HiRes;

	public static readonly lookups = {
		metadataTags: {
			LOSSLESS: Quality.High,
			[Quality.High.idx]: "LOSSLESS",
			SONY_360RA: Quality.Sony630,
			[Quality.Sony630.idx]: "SONY_360RA",
			DOLBY_ATMOS: Quality.Atmos,
			[Quality.Atmos.idx]: "DOLBY_ATMOS",
			HIRES_LOSSLESS: Quality.HiRes,
			[Quality.HiRes.idx]: "HIRES_LOSSLESS",
			MQA: Quality.MQA,
			[Quality.MQA.idx]: "MQA",
		},
		audioQuality: {
			HI_RES_LOSSLESS: Quality.HiRes,
			[Quality.HiRes.idx]: "HI_RES_LOSSLESS",
			HI_RES: Quality.HiRes,
			[Quality.HiRes.idx]: "HI_RES",
			LOSSLESS: Quality.High,
			[Quality.High.idx]: "LOSSLESS",
			HIGH: Quality.High,
			[Quality.High.idx]: "HIGH",
			LOW: Quality.Low,
			[Quality.Low.idx]: "LOW",
		},
	} as const;

	private static fromIdx(idx: number): Quality {
		return this.idxLookup[idx] ?? this.Lowest;
	}

	public static fromMetaTags(qualityTags?: MediaMetadataTag[]): Quality[] {
		if (!qualityTags) return [];
		return qualityTags.map((tag) => this.lookups.metadataTags[tag]);
	}
	public static fromAudioQuality(audioQuality?: MediaItemAudioQuality) {
		if (audioQuality === undefined) return undefined;
		return this.lookups.audioQuality[audioQuality];
	}

	public static min(...qualities: Quality[]): Quality {
		return Quality.fromIdx(Math.min(...(qualities as unknown as number[])));
	}
	public static max(...qualities: Quality[]): Quality {
		return Quality.fromIdx(Math.max(...(qualities as unknown as number[])));
	}

	public get audioQuality(): MediaItemAudioQuality {
		return Quality.lookups.audioQuality[this.idx];
	}
	public get metadataTag(): MediaMetadataTag {
		return Quality.lookups.metadataTags[this.idx];
	}

	valueOf(): number {
		return this.idx;
	}
}
