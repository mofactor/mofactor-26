// Startup file for Passenger (Plesk → Node.js → Application Startup File: passenger.cjs).
// Passenger require()s it, so it's CommonJS; the Astro server is ESM, hence import().
// Importing dist/server/entry.mjs starts the standalone server; Passenger intercepts its
// listen() call, so PORT and HOST don't matter there.
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

// Plesk doesn't read .env.local. Load it for runtime env (astro:env secrets such as
// BREVO_API_KEY); values already set in the environment (Plesk's Node.js settings) win.
const envFile = path.join(__dirname, ".env.local");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

import(pathToFileURL(path.join(__dirname, "dist/server/entry.mjs")).href).catch((error) => {
  console.error(error);
  process.exit(1);
});
