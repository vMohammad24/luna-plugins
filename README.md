# vMohammad's Luna Plugins

A collection of plugins for **[Tidal Luna](https://github.com/Inrixia/TidaLuna)** by vMohammad.

## Plugins

### @vmohammad/api

Provides a local HTTP and WebSocket API for real-time access to Tidal Data. The API server runs on port **24123**.

- **HTTP**: Returns all current fields as JSON.
- **WebSocket**: Subscribe to specific fields or all fields for real-time updates, and control playback.
    - **Subscribe**: Send `{ "action": "subscribe", "fields": ["field1", ...], "all": true|false }` to receive updates for only the fields you subscribe to, or all fields if `all` is true. Response: `{ "type": "subscribed", "fields": ["field1", ...], "all": true|false }`.
    - **Unsubscribe**: Send `{ "action": "unsubscribe" }` to stop receiving updates. Response: `{ "type": "unsubscribed" }`.
    - **Playback Control**: Send `{ "action": "pause" | "resume" | "toggle" | "next" | "previous" }` to control playback. Response: `{ "type": "ok", "action": "..." }`.
    - **Set Repeat Mode**: Send `{ "action": "setRepeatMode", "mode": 0|1|2 }` (where mode is 0=off, 1=all, 2=one). Response: `{ "type": "ok", "action": "setRepeatMode", "mode": n }`.
    - **Set Shuffle Mode**: Send `{ "action": "setShuffleMode", "shuffle": true|false }`. Response: `{ "type": "ok", "action": "setShuffleMode", "shuffle": true|false }`.
    - **Seek**: Send `{ "action": "seek", "time": seconds }` to seek to a specific time. Response: `{ "type": "ok", "action": "seek", "time": seconds }`.
    - **Set Volume**: Send `{ "action": "volume", "volume": 1-100 }` to set the playback volume (1-100). Response: `{ "type": "ok", "action": "volume", "volume": n }`.
    - **Error Handling**: If an unknown or malformed action is sent, the server responds with `{ "type": "error", "error": "..." }`.
    - **Update Messages**: When subscribed, you will receive `{ "type": "update", "all": true, "fields": { ... } }` for all fields, or `{ "type": "update", "all": false, "field": "field1", "value": ... }` for specific fields.

### @vmohammad/lrclib

Uses [lrclib](https://lrclib.net) to fetch lyrics when Tidal (Musixmatch) fails to provide them.

### @vmohammad/translate

Uses [Google Translate](https://translate.google.com/) to translate lyrics into your preferred language.


## Usage

1. Install Tidal Luna
2. Go to Luna Settings > Plugin Store
3. Scroll down until you find "@vmohammad/plugins"
4. Click on the plugin you want to install