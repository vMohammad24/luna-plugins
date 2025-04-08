export type Payload = {
	listened_at?: number; // The timestamp when the track was listened to (Unix time). Omit for "playing_now".
	track_metadata: {
		artist_name: string; // The name of the artist
		track_name: string; // The name of the track
		release_name?: string; // The name of the release (optional)
		additional_info?: AdditionalInfo;
	};
};

export type AdditionalInfo = {
	artist_mbids?: string[]; // List of MusicBrainz Artist IDs
	release_group_mbid?: string; // MusicBrainz Release Group ID
	release_mbid?: string; // MusicBrainz Release ID
	recording_mbid?: string; // MusicBrainz Recording ID
	track_mbid?: string; // MusicBrainz Track ID
	work_mbids?: string[]; // List of MusicBrainz Work IDs
	tracknumber?: number; // Track number
	isrc?: string; // ISRC code
	spotify_id?: string; // Spotify track URL
	tags?: string[]; // User-defined tags
	media_player?: string; // Media player used for playback
	media_player_version?: string; // Version of the media player
	submission_client?: string; // Client used to submit the listen
	submission_client_version?: string; // Version of the submission client
	music_service?: MusicServiceDomain; // Domain of the music service
	music_service_name?: MusicServiceName; // Textual name of the music service (if domain is unavailable)
	origin_url?: string; // URL of the source of the listen
	duration_ms?: number; // Duration of the track in milliseconds
	duration?: number; // Duration of the track in seconds
};

export enum MusicServiceDomain {
	Spotify = "spotify.com",
	YouTube = "youtube.com",
	Bandcamp = "bandcamp.com",
	Deezer = "deezer.com",
	TIDAL = "tidal.com",
	Soundcloud = "soundcloud.com",
	AppleMusic = "music.apple.com",
}

export enum MusicServiceName {
	Spotify = "Spotify",
	YouTube = "YouTube",
	Bandcamp = "Bandcamp",
	Deezer = "Deezer",
	TIDAL = "TIDAL",
	Soundcloud = "Soundcloud",
	AppleMusic = "Apple Music",
}
