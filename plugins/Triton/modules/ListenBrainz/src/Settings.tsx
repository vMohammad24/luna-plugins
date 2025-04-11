import { getStorage, React, TritonLink, TritonSecureTextSetting, TritonSettings } from "@triton/lib";
import { errSignal } from ".";

export const storage = getStorage<{ userToken?: string }>("ListenBrainz", {});

export const Settings = () => {
	const [token, setToken] = React.useState(storage.userToken);

	React.useEffect(() => {
		errSignal._ = (token ?? "") === "" ? "User token not set." : undefined;
	}, [token]);
	return (
		<TritonSettings>
			<TritonSecureTextSetting
				title="User token"
				desc={
					<>
						User token from{" "}
						<TritonLink fontWeight="bold" href="https://listenbrainz.org/settings">
							listenbrainz.org/settings
						</TritonLink>
					</>
				}
				value={token}
				onChange={(e) => setToken((storage.userToken = e.target.value))}
				error={!token}
			/>
		</TritonSettings>
	);
};
