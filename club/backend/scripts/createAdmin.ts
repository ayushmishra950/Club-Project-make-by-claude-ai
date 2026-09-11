import readline from "readline/promises";
import { stdin, stdout } from "process";
import mongoose from "mongoose";
import env from "../config/env.js";
import Admin, { ADMIN_ROLES } from "../models/admin.model.js";

/**
 * Creates the first admin account.
 *
 * Admin registration used to be an open HTTP endpoint, which meant anybody
 * could make themselves a super admin. It is now behind
 * `requireAdminRole("super_admin")`, so the very first account has to be
 * created here, with access to the server.
 *
 *   npx tsx scripts/createAdmin.ts
 *   npx tsx scripts/createAdmin.ts --email you@club.org --name "Priyank" --role super_admin
 *
 * The password is read interactively so it never lands in shell history.
 */

const parseFlags = () => {
  const flags: Record<string, string> = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg?.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        flags[key] = value;
        i += 1;
      } else {
        flags[key] = "true";
      }
    }
  }
  return flags;
};

const isStrong = (value: string) =>
  value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value);

const run = async () => {
  const flags = parseFlags();
  const rl = readline.createInterface({ input: stdin, output: stdout });

  try {
    await mongoose.connect(env.MONGO_URI);

    const name = flags.name || (await rl.question("Full name: ")).trim();
    const email = (flags.email || (await rl.question("Email: "))).trim().toLowerCase();

    const requestedRole = flags.role || "super_admin";
    if (!ADMIN_ROLES.includes(requestedRole as (typeof ADMIN_ROLES)[number])) {
      throw new Error(`Role must be one of: ${ADMIN_ROLES.join(", ")}`);
    }

    if (!name || !email) throw new Error("Name and email are both required.");

    const existing = await Admin.findOne({ email });
    if (existing) throw new Error(`An admin already exists with ${email}.`);

    const password = (await rl.question("Password (12+ chars, upper, lower, digit): ")).trim();
    if (!isStrong(password)) {
      throw new Error("That password is too weak. Use at least 12 characters with upper case, lower case and a digit.");
    }

    const confirm = (await rl.question("Confirm password: ")).trim();
    if (password !== confirm) throw new Error("The two passwords do not match.");

    const admin = await Admin.create({ name, email, password, role: requestedRole });

    console.log(`\nCreated ${admin.role} account for ${admin.email}`);
    console.log("Sign in at /admin and change nothing else here.\n");
  } catch (error) {
    console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
};

void run();
