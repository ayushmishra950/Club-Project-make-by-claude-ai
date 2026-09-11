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
  auth: (callback) => callback({ token: localStorage.getItem("admin.accessToken") || "" })
});

/** Opens the connection with the current token. Safe to call more than once. */
export const connectSocket = (token?: string) => {
  const accessToken = token ?? localStorage.getItem("admin.accessToken");
  if (!accessToken) return;

  if (socket.connected) socket.disconnect();
  socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

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
      body: JSON.stringify({ refreshToken: localStorage.getItem("admin.refreshToken") || undefined })
    });

    if (!res.ok) throw new Error("refresh failed");

    const { accessToken } = await res.json();
    localStorage.setItem("admin.accessToken", accessToken);

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
