#!/usr/bin/env node
/**
 * Builds both front ends and puts them where the compiled API serves them from.
 *
 * Why this exists: the API runs from `dist/app.js`, so it resolves the SPA
 * folders relative to `dist/`. `tsc` only emits JavaScript, so it never places
 * the front-end builds there. And the build output is git-ignored, so a host
 * that deploys from git never receives a copy made on somebody's laptop.
 *
 * Running this as part of the deploy solves both: the front ends are built on
 * the host, from source, straight into `dist/`.
 *
 *   npm run build:full     # API + both front ends
 *
 * Set SKIP_FRONTEND=1 to build the API alone.
 */

import { execFileSync } from "child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoDir = resolve(backendDir, "..");
const distDir = join(backendDir, "dist");

const apps = [
  { name: "admin dashboard", source: join(repoDir, "admin"), target: "admin_build" },
  { name: "member app", source: join(repoDir, "user", "connect-share"), target: "user_build" }
];

const step = (message) => process.stdout.write(`\n[1m==> ${message}[0m\n`);

const run = (command, args, cwd) =>
  execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      // Vite and its plugins live in devDependencies. A production install
      // prunes those, so the front-end build has to opt back in explicitly.
      NODE_ENV: "development",
      // @playwright/test downloads a few hundred megabytes of browsers on
      // install. The build does not run tests, and on a small instance that
      // download is enough to exhaust the disk or the memory limit.
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1",
      PUPPETEER_SKIP_DOWNLOAD: "1",
      // Never let a front-end install pull the whole optional tree.
      npm_config_fund: "false",
      npm_config_audit: "false"
    }
  });

/**
 * Install a front end, preferring the lock file but never dying on it.
 *
 * `npm ci` refuses to run when package-lock.json and package.json disagree,
 * and they can disagree through no fault of the repository: npm records peer
 * dependencies differently between versions, so a lock written by one npm can
 * be rejected by the newer npm on the build host. That turned a deploy into a
 * hard failure over a test library the build does not even use.
 *
 * So: try the reproducible path, and fall back to `npm install`, which
 * reconciles the lock instead of refusing.
 */
const install = (cwd, label) => {
  const hasLock = existsSync(join(cwd, "package-lock.json"));

  if (hasLock) {
    try {
      run("npm", ["ci", "--include=dev", "--no-audit", "--no-fund"], cwd);
      return;
    } catch {
      console.warn(
        `\n    npm ci could not use the lock file for the ${label}. ` +
          `Falling back to npm install.\n    ` +
          `To restore the reproducible path, run \`npm install\` in that folder ` +
          `with the same Node version as this host and commit the lock file.\n`
      );
    }
  }

  run("npm", ["install", "--include=dev", "--no-audit", "--no-fund"], cwd);
};

if (process.env.SKIP_FRONTEND === "1") {
  console.log("SKIP_FRONTEND=1, leaving the front ends out of this build.");
  process.exit(0);
}

if (!existsSync(distDir)) {
  console.error(`No ${distDir}. Run the API build first: npm run build`);
  process.exit(1);
}

for (const app of apps) {
  if (!existsSync(app.source)) {
    console.error(`\nCannot find ${app.name} at ${app.source}.`);
    console.error("This script expects the whole repository, not just the backend folder.");
    process.exit(1);
  }

  step(`Installing ${app.name}`);
  install(app.source, app.name);

  step(`Building ${app.name}`);
  run("npm", ["run", "build"], app.source);

  const built = join(app.source, "dist");
  if (!existsSync(built)) {
    console.error(`\n${app.name} produced no dist/ folder.`);
    process.exit(1);
  }

  const destination = join(distDir, app.target);
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  cpSync(built, destination, { recursive: true });

  console.log(`    -> ${destination}`);
}

step("Front ends bundled into the API build");
