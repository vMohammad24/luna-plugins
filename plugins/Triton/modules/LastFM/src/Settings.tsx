import { grey } from "@mui/material/colors";
import { Button, getStorage, React, TritonSetting, TritonSettings } from "@triton/lib";
import { errSignal, trace } from ".";
import { LastFM, type LastFmSession } from "./LastFM";

export const storage = getStorage<{
	session?: LastFmSession;
}>("LastFM", {});

export const Settings = () => {
	const [session, setSession] = React.useState(storage.session);
	const [loading, setLoading] = React.useState(false);

	const onClick = async () => {
		setLoading(true);
		const res = await LastFM.authenticate().catch(trace.err.withContext("Authenticating"));

		setSession((storage.session = res?.session));
		if (storage.session !== undefined) errSignal._ = undefined;
		setLoading(false);
	};

	const connected = session !== undefined;

	return (
		<TritonSettings>
			<TritonSetting
				title="Session"
				desc="Click connect to authenticate with LastFM"
				tooltip={connected ? "Reconnect LastFM" : "Connect LastFM"}
				control={
					<Button
						onClick={onClick}
						loading={loading}
						sx={{
							marginLeft: "auto",
							marginRight: 2,
							marginBottom: 0.5,
							backgroundColor: grey[900],
							color: connected ? "green !important" : `${grey.A200} !important`,
						}}
						variant="contained"
					>
						{loading ? "Loading..." : connected ? "Reconnect" : "Connect"}
					</Button>
				}
			/>
		</TritonSettings>
	);
};
