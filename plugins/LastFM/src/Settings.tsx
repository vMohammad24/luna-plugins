import { LunaButtonSetting, LunaSettings } from "@luna/ui";
import { errSignal, trace } from ".";
import { LastFM, type LastFmSession } from "./LastFM";

import { ReactiveStore } from "@luna/core";

import React from "react";

export const storage = await ReactiveStore.getPluginStorage<{
	session?: LastFmSession;
}>("LastFM");

export const Settings = () => {
	const [session, setSession] = React.useState(storage.session);
	const [loading, setLoading] = React.useState(false);

	const connected = session !== undefined;

	return (
		<LunaSettings>
			<LunaButtonSetting
				title="Session"
				desc={`Click ${connected ? "reconnect" : "connect"} to ${connected ? "re-" : ""}authenticate with LastFM`}
				tooltip={connected ? "Reconnect LastFM" : "Connect LastFM"}
				onClick={async () => {
					setLoading(true);
					const res = await LastFM.authenticate().catch(trace.err.withContext("Authenticating"));

					setSession((storage.session = res?.session));
					if (storage.session !== undefined) errSignal!._ = undefined;
					setLoading(false);
				}}
				loading={loading}
				sx={{
					color: connected ? "green" : undefined,
				}}
			>
				{loading ? "Loading..." : connected ? "Reconnect" : "Connect"}
			</LunaButtonSetting>
		</LunaSettings>
	);
};
