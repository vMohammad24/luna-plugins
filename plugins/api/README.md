# @vmohammad/api

Exposes TIDAL playback and queue state via HTTP and WebSocket for external control and monitoring.

## Features

- HTTP server returns current playback state as JSON (Currently actions are only avaliable via WebSocket)
- WebSocket server supports:
  - Subscribing to all or specific fields
  - Receiving real-time updates on playback, queue, and controls
  - Sending playback control commands (play, pause, next, previous, seek, volume, repeat, shuffle, add to queue, play next)

## Usage

### Start/Stop Server

- Server starts automatically on port `24123`
- To stop, call `stopServer()`

### HTTP API

#### GET /

Returns current playback state as JSON.

#### POST Actions

Send POST requests to control playback. The action is specified in the URL path, with parameters in the JSON body.

| Endpoint               | Body                  | Description                                     |
| ---------------------- | --------------------- | ----------------------------------------------- |
| `POST /pause`          | -                     | Pause playback                                  |
| `POST /resume`         | -                     | Resume playback                                 |
| `POST /toggle`         | -                     | Toggle play/pause                               |
| `POST /next`           | -                     | Skip to next track                              |
| `POST /previous`       | -                     | Go to previous track                            |
| `POST /seek`           | `{ "time": 120 }`     | Seek to position (seconds)                      |
| `POST /volume`         | `{ "volume": 50 }`    | Set volume (0-100, or "+10"/"-10" for relative) |
| `POST /setRepeatMode`  | `{ "mode": 0 }`       | Set repeat mode (0=Off, 1=All, 2=One)           |
| `POST /setShuffleMode` | `{ "shuffle": true }` | Enable/disable shuffle                          |
| `POST /playNext`       | `{ "itemId": "..." }` | Add item to play next                           |
| `POST /addToQueue`     | `{ "itemId": "..." }` | Add item to queue                               |

**Response format:**

- Success: `{ "type": "ok", "action": "...", ... }`
- Error: `{ "type": "error", "error": "..." }`

### WebSocket API

- Connect to `ws://localhost:24123`
- Send:
  - `{ "action": "subscribe", "fields": ["playing", "track"], "all": false }` to subscribe to specific fields
  - `{ "action": "subscribe", "all": true }` to subscribe to all fields
  - `{ "action": "unsubscribe" }` to unsubscribe
  - Control actions (see below)

#### Control Actions

Send JSON messages with these actions:

- `"pause"`, `"resume"`, `"toggle"`, `"next"`, `"previous"`
- `{ "action": "seek", "time": 120 }` (seek to 120s)
- `{ "action": "volume", "volume": 50 }` (set volume to 50%)
- `{ "action": "setRepeatMode", "mode": 0 }` (repeat mode: 0=Off, 1=All, 2=One)
- `{ "action": "setShuffleMode", "shuffle": true }`
- `{ "action": "playNext", "itemId": "..." }`
- `{ "action": "addToQueue", "itemId": "..." }`

### State Fields/Subscriptions

- `playing`, `playTime`, `repeatMode`, `lastPlayStart`, `playQueue`, `shuffle`, `volume`, `currentTime`, `album`, `artist`, `track`, `coverUrl`, `isrc`, `duration`, `bestQuality`
