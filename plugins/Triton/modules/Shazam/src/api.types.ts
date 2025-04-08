export interface ShazamData {
	matches: Match[];
	timestamp?: number;
	track?: Track;
	tagid?: string;
}

export interface Match {
	id?: string;
	offset?: number;
	timeskew?: number;
	frequencyskew?: number;
}

export interface Track {
	layout?: string;
	type?: string;
	key?: string;
	title?: string;
	subtitle?: string;
	images?: TrackImages;
	share?: Share;
	hub?: Hub;
	sections?: Section[];
	url?: string;
	artists?: Artist[];
	isrc?: string;
	genres?: Genres;
	urlparams?: Urlparams;
	myshazam?: Myshazam;
	highlightsurls?: Highlightsurls;
	relatedtracksurl?: string;
	albumadamid?: string;
}

export interface Artist {
	id?: string;
	adamid?: string;
}

export interface Genres {
	primary?: string;
}

export interface Highlightsurls {}

export interface Hub {
	type?: string;
	image?: string;
	actions?: Action[];
	options?: Option[];
	providers?: Provider[];
	explicit?: boolean;
	displayname?: string;
}

export interface Action {
	name?: string;
	type?: string;
	id?: string;
	uri?: string;
}

export interface Option {
	caption?: string;
	actions?: Action[];
	beacondata?: Beacondata;
	image?: string;
	type?: string;
	listcaption?: string;
	overflowimage?: string;
	colouroverflowimage?: boolean;
	providername?: string;
}

export interface Beacondata {
	type?: string;
	providername?: string;
}

export interface Provider {
	caption?: string;
	images?: ProviderImages;
	actions?: Action[];
	type?: string;
}

export interface ProviderImages {
	overflow?: string;
	default?: string;
}

export interface TrackImages {
	background?: string;
	coverart?: string;
	coverarthq?: string;
	joecolor?: string;
}

export interface Myshazam {
	apple?: Apple;
}

export interface Apple {
	actions?: Action[];
}

export interface Section {
	type?: string;
	metapages?: Metapage[];
	tabname?: string;
	metadata?: Metadatum[];
	url?: string;
}

export interface Metadatum {
	title?: string;
	text?: string;
}

export interface Metapage {
	image?: string;
	caption?: string;
}

export interface Share {
	subject?: string;
	text?: string;
	href?: string;
	image?: string;
	twitter?: string;
	html?: string;
	snapchat?: string;
}

export interface Urlparams {
	"{tracktitle}"?: string;
	"{trackartist}"?: string;
}
