import mongoose from "mongoose";
import Admin from "../models/admin.model.js";

/**
 * Wipes the throwaway test database and seeds the admin the suites sign in as.
 *
 * Both suites register members with fixed mobile numbers, so a second run
 * against a database that still holds the first run's members fails at
 * registration with a duplicate, and every later check fails after it with an
 * empty member id. Run this before each run:
 *
 *   MONGO_URI="<cluster>/club_featuretest" npx tsx scripts/resetTestDb.ts
 *   MONGO_URI="<cluster>/club_featuretest" PORT=5199 npx tsx app.ts &
 *   npx tsx scripts/featureTest.ts
 */

/** The password both suites use. Only ever reaches a database named below. */
const ADMIN_PASSWORD = "SuperSecret123";

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is required, and must point at a test database.");
  process.exit(1);
}

/* This script drops a whole database, so it refuses to run against anything
   that is not obviously disposable. Without the guard, one stale shell with
   the live MONGO_URI still exported would destroy the club's data. */
const dbName = new URL(uri.replace("mongodb+srv://", "https://")).pathname.replace(/^\//, "").split("?")[0];
if (!/test/i.test(dbName)) {
  console.error(`Refusing to drop "${dbName}": the database name must contain "test".`);
  process.exit(1);
}

await mongoose.connect(uri);
await mongoose.connection.dropDatabase();

// The model hashes on save, so the password is passed in plain.
await Admin.create({
  name: "Feature Test Root",
  email: "root@featuretest.local",
  password: ADMIN_PASSWORD,
  role: "super_admin"
});

console.log(`Dropped "${dbName}" and seeded root@featuretest.local`);
await mongoose.disconnect();
