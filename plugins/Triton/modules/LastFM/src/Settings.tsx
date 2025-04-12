import { getStorage, React, TritonButtonSetting, TritonSettings } from "@triton/lib";
import { errSignal, trace } from ".";
import { LastFM, type LastFmSession } from "./LastFM";

export const storage = getStorage<{
	session?: LastFmSession;
}>("LastFM", {});

export const Settings = () => {
	const [session, setSession] = React.useState(storage.session);
	const [loading, setLoading] = React.useState(false);

	const connected = session !== undefined;

	return (
		<TritonSettings>
			<TritonButtonSetting
				title="Session"
				desc={`Click ${connected ? "reconnect" : "connect"} to ${connected ? "re-" : ""}authenticate with LastFM`}
				tooltip={connected ? "Reconnect LastFM" : "Connect LastFM"}
				onClick={async () => {
					setLoading(true);
					const res = await LastFM.authenticate().catch(trace.err.withContext("Authenticating"));

					setSession((storage.session = res?.session));
					if (storage.session !== undefined) errSignal._ = undefined;
					setLoading(false);
				}}
				loading={loading}
				sx={{
					color: connected ? "green" : undefined,
				}}
			>
				{loading ? "Loading..." : connected ? "Reconnect" : "Connect"}
			</TritonButtonSetting>
		</TritonSettings>
	);
};
