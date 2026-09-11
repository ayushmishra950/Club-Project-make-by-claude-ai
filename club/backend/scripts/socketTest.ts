import { io, type Socket } from "socket.io-client";

/**
 * Realtime test.
 *
 * The HTTP suite proves the data is right; this proves the notification
 * actually reaches the other person. It matters because a member's personal
 * room is named by their account id, and fifteen places in the controllers
 * emit with `io.to(someUserId)`. If that name ever drifts from what the
 * socket joins, every one-to-one notification stops arriving and nothing
 * fails loudly.
 */

const API = process.env.API ?? "http://localhost:5199/api";
const ORIGIN = API.replace(/\/api$/, "");

let pass = 0;
let fail = 0;

const record = (name: string, ok: boolean, detail = "") => {
  console.log(`  ${ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m"}  ${name}${ok ? "" : `  -- ${detail}`}`);
  ok ? (pass += 1) : (fail += 1);
};

const post = async (path: string, body: unknown, token?: string) => {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: (await res.json().catch(() => ({}))) as any };
};

const patch = async (path: string, body: unknown, token: string) => {
  const res = await fetch(`${API}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  return { status: res.status, data: (await res.json().catch(() => ({}))) as any };
};

const connect = (token: string) =>
  new Promise<Socket>((resolve, reject) => {
    const socket = io(ORIGIN, { auth: { token }, transports: ["websocket"], reconnection: false });
    const timer = setTimeout(() => reject(new Error("socket did not connect within 8s")), 8000);
    socket.on("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on("connect_error", (error: Error) => {
      clearTimeout(timer);
      reject(error);
    });
  });

/** Resolves with the first matching event, or null if it never arrives. */
const waitFor = (socket: Socket, event: string, ms = 5000) =>
  new Promise<unknown>((resolve) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      resolve(null);
    }, ms);
    const handler = (payload: unknown) => {
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    };
    socket.on(event, handler);
  });

const stamp = Date.now();

const run = async () => {
  console.log(`\nRealtime test against ${ORIGIN}\n`);

  /* ---- two members and an admin ---- */

  const admin = await post("/admin/auth/login", {
    email: "root@featuretest.local",
    password: "SuperSecret123"
  });
  const adminToken = admin.data.accessToken as string;

  const people = [
    { email: `sock-a-${stamp}@featuretest.local`, name: "Socket A", id: "", token: "" },
    { email: `sock-b-${stamp}@featuretest.local`, name: "Socket B", id: "", token: "" }
  ];

  for (const [index, person] of people.entries()) {
    const reg = await post("/user/auth/register", {
      fullName: person.name,
      email: person.email,
      mobile: `9${String(700000000 + index + (stamp % 90000))}`.slice(0, 10),
      password: "Passw0rd123",
      confirmPassword: "Passw0rd123"
    });
    person.id = reg.data.data?._id;
  }

  await patch("/admin/user/verify", { memberIds: people.map((p) => p.id) }, adminToken);

  for (const person of people) {
    const login = await post("/user/auth/login", { identifier: person.email, password: "Passw0rd123" });
    person.token = login.data.accessToken;
  }

  const [alpha, beta] = people;

  /* ---- connect ---- */

  let socketA: Socket | null = null;
  let socketB: Socket | null = null;

  try {
    socketA = await connect(alpha!.token);
    record("member connects with a valid token", true);
  } catch (error) {
    record("member connects with a valid token", false, (error as Error).message);
  }

  try {
    socketB = await connect(beta!.token);
    record("second member connects", true);
  } catch (error) {
    record("second member connects", false, (error as Error).message);
  }

  try {
    await connect("not-a-real-token");
    record("an invalid token is rejected", false, "the handshake was accepted");
  } catch {
    record("an invalid token is rejected", true);
  }

  if (!socketA || !socketB) {
    console.log("\nCannot continue without both sockets.");
    process.exit(1);
  }

  /* ---- the notification actually reaches the other member ---- */

  const incoming = waitFor(socketB, "notification");
  await post("/user/friend/request/send", { fromId: alpha!.id, toId: beta!.id }, alpha!.token);
  const notification = await incoming;

  record(
    "a friend request reaches the recipient's socket",
    notification !== null,
    "no notification arrived, so the personal room name does not match what the controllers emit to"
  );

  /* ---- presence ---- */

  const presence = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 5000);
    socketA.on("userOffline", (id: string) => {
      if (id === beta!.id) {
        clearTimeout(timer);
        resolve(true);
      }
    });
    setTimeout(() => socketB!.disconnect(), 300);
  });

  record("going offline is broadcast to other members", presence, "no userOffline event arrived");

  /* ---- unread count comes back on the same socket ---- */

  const unread = await new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => resolve(false), 5000);
    socketA.on("totalUnReadChat", () => {
      clearTimeout(timer);
      resolve(true);
    });
    socketA.emit("getUnreadCount");
  });

  record("unread chat count is returned over the socket", unread, "no totalUnReadChat event arrived");

  socketA.disconnect();

  console.log(`\n${"=".repeat(48)}`);
  console.log(`TOTAL: ${pass} passed, ${fail} failed`);
  console.log("=".repeat(48));

  process.exit(fail ? 1 : 0);
};

void run();
