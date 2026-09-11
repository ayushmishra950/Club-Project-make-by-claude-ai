import mongoose from "mongoose";
import env from "../config/env.js";

/**
 * Builds every index declared on every model.
 *
 * Mongoose creates indexes lazily on first use by default, which is fine in
 * development and wrong in production: the first request after a deploy pays
 * for the build, and `autoIndex` is normally disabled there anyway. Run this
 * once as part of the deploy instead.
 *
 *   npm run sync-indexes              create missing indexes, drop nothing
 *   npm run sync-indexes -- --prune   also drop indexes no longer declared
 *   npm run sync-indexes -- --dry-run report what would change, change nothing
 *
 * Creating is safe and additive. Pruning is not: an index created by hand in
 * Atlas, or one belonging to a branch that has not deployed yet, would be
 * dropped. That is why it is opt-in rather than the default.
 */

const models = [
  "../models/user.model.js",
  "../models/admin.model.js",
  "../models/post.model.js",
  "../models/chat.model.js",
  "../models/message.model.js",
  "../models/notification.model.js",
  "../models/friendRequest.model.js",
  "../models/block.model.js",
  "../models/group.model.js",
  "../models/event.model.js",
  "../models/gallery.model.js",
  "../models/announcement.model.js",
  "../models/news.js",
  "../models/review.model.js",
  "../models/report.mode.js",
  "../models/suggestion.model.js",
  "../models/donate.model.js",
  "../models/business.group.model.js",
  "../models/event.category.model.js",
  "../models/resetPassword.model.js",
  "../models/GroupInviteSchema.js"
];

const run = async () => {
  await mongoose.connect(env.MONGO_URI);
  console.log(`Connected to ${mongoose.connection.name}\n`);

  for (const path of models) {
    try {
      await import(path);
    } catch (error) {
      console.warn(`  skipped ${path}: ${(error as Error).message}`);
    }
  }

  const prune = process.argv.includes("--prune");
  const dryRun = process.argv.includes("--dry-run");

  if (dryRun) console.log("Dry run: nothing will be created or dropped.\n");
  else if (prune) console.log("Pruning enabled: indexes not declared on a model will be DROPPED.\n");

  for (const name of mongoose.modelNames()) {
    const model = mongoose.model(name);

    try {
      const existing = await model.listIndexes().catch(() => []);
      const existingNames = new Set((existing as Array<{ name: string }>).map((index) => index.name));

      // What the schema declares, named the way MongoDB will name it.
      const declared = (model.schema.indexes() as Array<[Record<string, unknown>, { name?: string } | undefined]>).map(
        ([fields, options]) => options?.name ?? Object.entries(fields).map(([key, dir]) => `${key}_${dir}`).join("_")
      );
      declared.push("_id_");

      const missing = declared.filter((index) => !existingNames.has(index));
      const extra = [...existingNames].filter((index) => !declared.includes(index));

      if (dryRun) {
        console.log(
          `${name.padEnd(18)} ${existing.length} present` +
            (missing.length ? `, would create ${missing.join(", ")}` : "") +
            (prune && extra.length ? `, would drop ${extra.join(", ")}` : "")
        );
        continue;
      }

      if (prune) {
        const dropped = await model.syncIndexes();
        const current = await model.listIndexes();
        console.log(`${name.padEnd(18)} ${current.length} index(es)${dropped.length ? `, dropped ${dropped.join(", ")}` : ""}`);
      } else {
        // Additive only. createIndexes leaves anything it did not declare alone.
        await model.createIndexes();
        const current = await model.listIndexes();
        console.log(
          `${name.padEnd(18)} ${current.length} index(es)` +
            (missing.length ? `, created ${missing.length}` : ", nothing to do") +
            (extra.length ? `  (${extra.length} not declared, left alone)` : "")
        );
      }
    } catch (error) {
      console.error(`${name.padEnd(18)} FAILED: ${(error as Error).message}`);
      process.exitCode = 1;
    }
  }

  console.log("\nDone.");
  await mongoose.disconnect();
};

void run();
