const fs = require("fs");

const shazamPath = "./node_modules/shazamio-core/web";
const shazamFile = `${shazamPath}/shazamio-core.js`;
const wasmBase64 = fs.readFileSync(`${shazamPath}/shazamio-core_bg.wasm`).toString("base64");
fs.writeFileSync(shazamFile, fs.readFileSync(shazamFile).toString().replaceAll("new URL('shazamio-core_bg.wasm', import.meta.url);", `Buffer.from("${wasmBase64}", 'base64')`));
