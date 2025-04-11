import { getStorage, React, TritonLink, TritonSecureTextSetting, TritonSettings } from "@triton/lib";

export const storage = getStorage<{ userToken?: string }>("ListenBrainz", {});

export const Settings = () => {
	const [showToken, setShowToken] = React.useState(false);
	const [token, setToken] = React.useState(storage.userToken || "");

	const handleTokenChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newToken = event.target.value;
		setToken(newToken);
		storage.userToken = newToken;
	};

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
				onChange={handleTokenChange}
				error={!token}
			/>
		</TritonSettings>
	);
};
