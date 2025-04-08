import { plugins } from "@neptune";
import { id } from "@plugin";
const url = new URL(id);
const pathParts = url.pathname.split("/");
pathParts.pop();
plugins.installPluginFromURL(`${url.origin}${pathParts.join()}/Triton`).then(() => plugins.removePlugin(id));
