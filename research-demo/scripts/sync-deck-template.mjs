import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, "../../build/deck.template.html");
const destination = resolve(here, "../lib/deck.template.html");

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
console.log("Synced the main Deck Template into the live app bundle.");
