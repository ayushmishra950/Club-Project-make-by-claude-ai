import { io } from "socket.io-client";

/**
 * The realtime connection.
 *
 * Two things changed here. The socket no longer connects before anybody has
 * signed in, because the server now rejects an unauthenticated handshake and
 * the client would otherwise retry forever. And the token is read at connect
 * time rather than captured once at module load, so a session that refreshes
 * reconnects with the new token instead of the expired one.
 */

// Same origin when no socket URL is configured, which is the case when the
// API serves this build itself. socket.io treats undefined as same-origin, but
// being explicit keeps it obvious.
const SOCKET_URL = import.meta.env.VITE_BACKEND_SOCKET_URL || window.location.origin;

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  auth: (callback) => callback({ token: localStorage.getItem("member.accessToken") || "" })
});

/** Opens the connection with the current token. Safe to call more than once. */
export const connectSocket = (token?: string) => {
  const accessToken = token ?? localStorage.getItem("member.accessToken");
  if (!accessToken) return;

  if (socket.connected) socket.disconnect();
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

/* ------------------------------------------------------------------ *
 * Live presence
 * ------------------------------------------------------------------ *
 *
 * Who is connected right now, kept in one place.
 *
 * This used to live inside the chat panel, which caused two problems. Only
 * that one component could show a dot, so every other page fell back to the
 * `isOnline` the API had baked into the list when it was fetched: a member
 * coming online mid-session never lit up. And the list arrives exactly once,
 * in `onlineUsersList` right after the handshake, so navigating away from
 * chat and back threw it away with no way to ask for it again, leaving
 * everybody looking offline until somebody happened to connect.
 *
 * The listeners belong to the socket, so they are attached once here, when the
 * socket is created, rather than once per component that happens to be mounted.
 */

const onlineUsers = new Set<string>();
const presenceListeners = new Set<() => void>();

/* A counter, not the set's size: one member going offline as another comes
   online leaves the size unchanged, and React would skip the re-render. */
let presenceVersion = 0;

const notifyPresence = () => {
  presenceVersion += 1;
  for (const listener of presenceListeners) listener();
};

/** Subscribe to presence changes. Returns an unsubscribe function. */
export const subscribePresence = (listener: () => void) => {
  presenceListeners.add(listener);
  return () => {
    presenceListeners.delete(listener);
  };
};

/** Is this member connected right now? */
export const isUserOnline = (userId?: string | null) =>
  Boolean(userId) && onlineUsers.has(String(userId));

/** Changes on every presence update, so React knows to re-render. */
export const getPresenceVersion = () => presenceVersion;

// The full list arrives once, right after the handshake.
socket.on("onlineUsersList", (ids: string[]) => {
  onlineUsers.clear();
  for (const id of ids ?? []) onlineUsers.add(String(id));
  notifyPresence();
});

socket.on("userOnline", (id: string) => {
  if (!id) return;
  onlineUsers.add(String(id));
  notifyPresence();
});

socket.on("userOffline", (id: string) => {
  if (!id) return;
  onlineUsers.delete(String(id));
  notifyPresence();
});

// Our own connection dropping tells us nothing about anybody else, so clear
// the list rather than leaving stale dots lit until we reconnect.
socket.on("disconnect", () => {
  onlineUsers.clear();
  notifyPresence();
});

/**
 * An expired token closes the socket. Refresh once, then reconnect.
 *
 * The refresh call is deliberately a bare fetch rather than the shared axios
 * instance: that instance redirects to the sign-in page on a 401, and a failed
 * socket refresh should not navigate the user away mid-session.
 */
let refreshing = false;

socket.on("connect_error", async (err: Error) => {
  if (!err.message?.includes("TokenExpired") || refreshing) return;

  refreshing = true;
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || "/api"}/user/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: localStorage.getItem("member.refreshToken") || undefined })
    });

    if (!res.ok) throw new Error("refresh failed");

    const { accessToken } = await res.json();
    localStorage.setItem("member.accessToken", accessToken);

    socket.disconnect();
    socket.connect();
  } catch {
    // The session is genuinely over. The next API call will handle sign-out;
    // reconnecting here would just loop.
    socket.disconnect();
  } finally {
    refreshing = false;
  }
});

export default socket;
