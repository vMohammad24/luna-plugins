import { app, session } from 'electron';

type NoTrackNativeSettings = {
    disableSentry: boolean;
    disableEventBatch: boolean;
    disableDataDome: boolean;
};

let nativeSettings: NoTrackNativeSettings = {
    disableSentry: true,
    disableEventBatch: false,
    disableDataDome: false,
};

export function updateNoTrackNativeSettings(partial: Partial<NoTrackNativeSettings>) {
    nativeSettings = { ...nativeSettings, ...partial };
}

app.whenReady().then(() => {
    const urls: string[] = ['*://*.sentry.io/*', 'https://desktop.tidal.com/api/event-batch', "https://dd.tidal.com/*", "https://browser-intake-datadoghq.com/*"];
    const filter = { urls };

    session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
        if (details.url.includes('sentry.io')) {
            if (nativeSettings.disableSentry) {
                callback({ cancel: true });
            } else {
                callback({});
            }
            return;
        }
        if (details.url.includes('event-batch')) {
            if (nativeSettings.disableEventBatch) {
                callback({ cancel: true });
            } else {
                callback({});
            }
            return;
        }

        if (details.url.includes('dd.tidal.com') || details.url.includes('browser-intake-datadoghq.com')) {
            if (nativeSettings.disableDataDome) {
                callback({ cancel: true });
            } else {
                callback({});
            }
            return;
        }
        callback({});
    });

    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        const headers = details.requestHeaders;
        delete headers['sentry-trace'];
        delete headers['baggage'];
        callback({ requestHeaders: headers });
    });
});