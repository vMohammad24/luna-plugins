import { getResponder } from "@homebridge/ciao";
import { hostname } from "os";

const RemoteDesktopController = require("./original.asar/app/main/remoteDesktop/RemoteDesktopController.js").default;
const { generateDeviceId, generateFriendlyName } = require("./original.asar/app/main/mdns/broadcast.js");

const websocket = require("./original.asar/app/main/remoteDesktop/websocket.js").default;

export const setup = () => {
	if (RemoteDesktopController.__running) return console.warn("RemoteDesktopController is already running");

	const responder = getResponder();
	const deviceId = generateDeviceId();

	const service = responder.createService({
		disabledIpv6: true,
		port: 2019,
		type: "tidalconnect",
		name: `RemoteDesktop-${deviceId}`,
		txt: {
			mn: "RemoteDesktop",
			id: deviceId,
			fn: `TidaLuna: ${hostname().split(".")[0]}`,
			ca: "0",
			ve: "1",
		},
	});

	RemoteDesktopController.__running = true;
	const neptuneRemoteDesktop = new RemoteDesktopController();
	neptuneRemoteDesktop.mdnsStartBroadcasting = () => service.advertise();
	neptuneRemoteDesktop.mdnsStopBroadcasting = () => service.end();

	neptuneRemoteDesktop.initialize("https://desktop.tidal.com");
	neptuneRemoteDesktop.mdnsStartBroadcasting();

	neptuneRemoteDesktop.remoteDesktopPlayer.remotePlayerProcess.stdout.on("data", (...args: any[]) =>
		console.log("DesktopConnect.remotePlayerProcess.stdout", ...args)
	);
};
setup();

export const send = websocket.send.bind(websocket);
