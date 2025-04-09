import { TritonStack } from "@triton/lib";
import * as React from "react";
import type { TritonModule } from "./TritonModule";

export const TritonModuleSettings = ({ module }: { module: TritonModule }) => {
	const [ModuleExports, setModuleExports] = React.useState(module.exports);

	React.useEffect(() => module.onExports(setModuleExports), [module.exports]);
	return <TritonStack title={module.name}>{ModuleExports?.Settings && <ModuleExports.Settings />}</TritonStack>;
};
