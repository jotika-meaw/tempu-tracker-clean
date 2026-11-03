// Build a self-contained copy of the API for Vercel's zero-config Express
// preset in server/.vercel-deploy (git-ignored), then deploy it with:
//
//   node scripts/stage-vercel.mjs
//   cd .vercel-deploy && vercel deploy --prod --project tempu-tracker-server
//
// Vercel uploads only the deployed folder and runs Node ESM, so the staged
// copy (1) vendors ../shared as ./shared, (2) adds `.js` to relative imports,
// and (3) uses server.ts as the entry, which default-exports the app instead
// of calling app.listen. app.ts is renamed so the preset does not pick it.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const sharedDir = join(serverDir, "..", "shared");
const outDir = join(serverDir, ".vercel-deploy");
const skip = new Set(["node_modules", "test", ".env", ".vercel-deploy", ".vercel", "scripts"]);

const linked = (() => {
  try {
    return readFileSync(join(outDir, ".vercel", "project.json"), "utf8");
  } catch {
    return null;
  }
})();

// Empty the folder rather than deleting it, so a shell open inside it on
// Windows does not block the rebuild.
mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}

for (const entry of readdirSync(serverDir)) {
  if (skip.has(entry)) continue;
  cpSync(join(serverDir, entry), join(outDir, entry === "app.ts" ? "create-app.ts" : entry), {
    recursive: true,
  });
}
cpSync(sharedDir, join(outDir, "shared"), { recursive: true });

function rewrite(file) {
  const fromRoot = relative(outDir, file).split("\\").join("/");
  const depth = fromRoot.split("/").length - 1;
  const up = depth === 0 ? "./" : "../".repeat(depth);
  let source = readFileSync(file, "utf8");
  source = source.replace(/from "((?:\.\.?\/)+)([^"]+)"/g, (match, prefix, path) => {
    let target = `${prefix}${path}`;
    // ../shared (server root) and ../../shared (server/ai) now live in ./shared.
    target = target.replace(/^(\.\.\/)+shared\//, `${up}shared/`);
    if (fromRoot.startsWith("shared/")) target = `${prefix}${path}`;
    target = target.replace(/^((?:\.\.?\/)+)app$/, "$1create-app");
    return /\.(js|json)$/.test(target) ? `from "${target}"` : `from "${target}.js"`;
  });
  writeFileSync(file, source);
}

(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith(".ts")) rewrite(path);
  }
})(outDir);

writeFileSync(
  join(outDir, "server.ts"),
  `import type { Express } from "express";
import { bootstrap } from "./bootstrap.js";

// Vercel Express entrypoint: the preset serves the default-exported app. It
// only accepts an entry file that imports express, hence the type import.
const { app }: { app: Express } = await bootstrap();

export default app;
`
);

writeFileSync(
  join(outDir, "bootstrap.ts"),
  `import { loadConfig } from "./config.js";
import { createTrackingStore } from "./tracking/factory.js";
import { createMetaClient } from "./ai/meta-client.js";
import { MetaAIService } from "./ai/service.js";
import { MuseTranscriber } from "./ai/transcribe.js";
import { createApp } from "./create-app.js";
import { TEMPU_ROUTE_NUMBERS } from "./shared/routes.js";

export async function bootstrap() {
  const config = loadConfig(process.env);
  const { store, warning } = await createTrackingStore(config);
  if (warning) console.warn(warning);

  const aiClient = config.modelApiKey
    ? createMetaClient({
        apiKey: config.modelApiKey,
        baseUrl: config.metaBaseUrl,
        timeoutMs: config.aiTimeoutMs,
      })
    : null;

  const ai = new MetaAIService({
    client: aiClient,
    model: config.metaModel,
    baseUrl: config.metaBaseUrl,
    maxOutputTokens: config.aiMaxOutputTokens,
    timeoutMs: config.aiTimeoutMs,
    allowedRouteNumbers: TEMPU_ROUTE_NUMBERS,
  });

  const transcriber = new MuseTranscriber({
    apiKey: config.modelApiKey,
    timeoutMs: config.aiTimeoutMs,
  });

  const app = createApp({ config, store, ai, transcriber });
  return { config, store, ai, app };
}
`
);

// index.ts calls app.listen for local use only; drop it so the preset uses server.ts.
rmSync(join(outDir, "index.ts"), { force: true });

const tsconfigPath = join(outDir, "tsconfig.json");
const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
tsconfig.include = ["**/*.ts"];
writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);

// Vercel's TypeScript builder needs TypeScript 5.x and the type packages at
// build time; TypeScript 7 (used locally) made earlier deploys fail.
const packagePath = join(outDir, "package.json");
const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
const dev = pkg.devDependencies ?? {};
pkg.dependencies = {
  ...pkg.dependencies,
  "@types/cors": dev["@types/cors"],
  "@types/express": dev["@types/express"],
  "@types/node": dev["@types/node"],
  "@vercel/node": "^29.0.1",
};
pkg.devDependencies = { typescript: "^5.9.3" };
pkg.main = "server.ts";
writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}
`);
rmSync(join(outDir, "package-lock.json"), { force: true });

if (linked) {
  mkdirSync(join(outDir, ".vercel"), { recursive: true });
  writeFileSync(join(outDir, ".vercel", "project.json"), linked);
}

console.log(`Staged API for Vercel in ${outDir}`);
