import { ReactiveStore } from "@luna/core";
import { LunaLink, LunaSecureTextSetting, LunaSettings } from "@luna/ui";

import React from "react";

import { errSignal } from ".";

export const storage = await ReactiveStore.getPluginStorage<{
	userToken?: string;
}>("ListenBrainz");

export const Settings = () => {
	const [token, setToken] = React.useState(storage.userToken);

	React.useEffect(() => {
		errSignal!._ = (token ?? "") === "" ? "User token not set." : undefined;
	}, [token]);
	return (
		<LunaSettings>
			<LunaSecureTextSetting
				title="User token"
				desc={
					<>
						User token from{" "}
						<LunaLink fontWeight="bold" href="https://listenbrainz.org/settings">
							listenbrainz.org/settings
						</LunaLink>
					</>
				}
				value={token}
				onChange={(e) => setToken((storage.userToken = e.target.value))}
				error={!token}
			/>
		</LunaSettings>
	);
};
