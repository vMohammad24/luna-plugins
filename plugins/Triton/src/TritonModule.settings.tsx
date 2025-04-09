import * as React from "react";
import type { TritonModule } from "./TritonModule";

export const TritonModuleSettings = ({ module }: { module: TritonModule }) => {
	const [ModuleExports, setModuleExports] = React.useState(module.exports);

	React.useEffect(() => module.onExports(setModuleExports), [module.exports]);
	if (ModuleExports?.Settings) return <ModuleExports.Settings />;
	return null;
};
