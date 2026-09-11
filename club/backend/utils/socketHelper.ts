import { Server as IOServer, type Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";
import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import Notification, { NotificationType } from "../models/notification.model.js";
import Group from "../models/group.model.js";
import { originCallback } from "../config/cors.js";
import { verifyAccessToken } from "../utils/generateToken.js";
import env from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * Realtime layer.
 *
 * The handshake already verified a JWT before this rework, but almost none of
 * the event handlers used the result: they read a user id out of the event
 * payload instead, so any connected member could mark somebody else's
 * messages as read or flip their online status. Every handler below now takes
 * the actor from `socket.data.actor` and ignores any id the client sends.
 *
 * Broadcasts are scoped to a room. `io.emit` reaches every connected client on
 * the server and is reserved for genuinely global events.
 */

interface Actor {
  id: string;
  type: "user" | "admin";
}

interface AuthedSocket extends Socket {
  data: { actor?: Actor };
}

let io: IOServer;

/**
 * Who is currently connected, and on how many sockets.
 *
 * This lives in process memory, which is correct for a single instance. Before
 * running a second one, swap this and the broadcast fan-out for
 * `@socket.io/redis-adapter`; the handler code does not change.
 */
const onlineUsers = new Map<string, Set<string>>();

const ADMIN_ROOM = "role:admin";

/**
 * A member's personal room is their account id, with no prefix.
 *
 * Fifteen call sites across the controllers emit with `io.to(someUserId)`,
 * so the room name has to be exactly that id. Prefixing it means those emits
 * land in a room nobody has joined and the notification silently never
 * arrives. Chat rooms and the admin room are prefixed because they are named
 * by this file alone.
 */
const roomFor = (userId: string) => userId;
const chatRoom = (chatId: string) => `chat:${chatId}`;

const markOnline = async (actor: Actor, online: boolean) => {
  const update = online
    ? { isOnline: true }
    : { isOnline: false, lastSeen: new Date().toISOString() };

  if (actor.type === "admin") {
    await Admin.findByIdAndUpdate(actor.id, update);
  } else {
    await User.findByIdAndUpdate(actor.id, update);
  }
};

/** Unread message count for one member, across all their chats. */
const getUnreadCount = async (userId: string) => {
  const chats = await Chat.find({ members: userId }).select("_id").lean();
  if (chats.length === 0) return 0;

  return Message.countDocuments({
    chatId: { $in: chats.map((chat) => chat._id) },
    sender: { $ne: userId },
    seenBy: { $ne: userId },
    isDeleted: { $ne: true }
  });
};

/** True when this member is actually in the chat they claim to be acting on. */
const isChatMember = async (chatId: string, userId: string) => {
  const chat = await Chat.findOne({ _id: chatId, members: userId }).select("_id").lean();
  return Boolean(chat);
};

/**
 * Clears every online flag at boot.
 *
 * `isOnline` is written to the database when a socket connects and cleared
 * when it disconnects. If the process stops without a clean disconnect — a
 * deploy, a crash, or a host that idles the instance to sleep — the flag stays
 * true for ever. One member had been showing as online since June.
 *
 * Nobody can be connected to a process that has only just started, so the
 * honest state at boot is: everybody offline.
 */
const resetPresence = async () => {
  try {
    const [users, admins] = await Promise.all([
      User.updateMany({ isOnline: true }, { $set: { isOnline: false } }),
      Admin.updateMany({ isOnline: true }, { $set: { isOnline: false } })
    ]);

    const cleared = (users.modifiedCount ?? 0) + (admins.modifiedCount ?? 0);
    if (cleared > 0) logger.info({ cleared }, "Cleared stale online flags left by a previous run");
  } catch (error) {
    logger.error({ err: error }, "Could not reset presence at boot");
  }
};

export const initSocket = (server: HTTPServer) => {
  void resetPresence();

  io = new IOServer(server, {
    cors: {
      // The same policy the HTTP API uses, so a front end that can reach the
      // API can always open a socket too.
      origin: originCallback,
      credentials: true
    },
    // Sockets that stop responding are dropped rather than held open.
    pingTimeout: 30_000,
    pingInterval: 25_000,
    maxHttpBufferSize: 1e6
  });

  /* ---------------- handshake ---------------- */

  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) return next(new Error("Authentication error"));

    try {
      const payload = verifyAccessToken(token);
      socket.data.actor = { id: payload.sub, type: payload.type };
      return next();
    } catch (error) {
      const name = (error as { name?: string })?.name;
      if (name === "TokenExpiredError") return next(new Error("TokenExpired"));
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: AuthedSocket) => {
    const actor = socket.data.actor;
    if (!actor) return socket.disconnect(true);

    /* ---------------- join ----------------
       Rooms are joined from the verified identity at connection time. The
       client no longer tells the server which room it belongs in. */

    socket.join(roomFor(actor.id));
    if (actor.type === "admin") socket.join(ADMIN_ROOM);

    const sockets = onlineUsers.get(actor.id) ?? new Set<string>();
    const wasOffline = sockets.size === 0;
    sockets.add(socket.id);
    onlineUsers.set(actor.id, sockets);

    if (wasOffline) {
      // Announce before the database write, so the dot appears without waiting
      // on a round trip. The same ordering as the disconnect path.
      socket.broadcast.emit("userOnline", actor.id);
      await markOnline(actor, true);
    }

    socket.emit("onlineUsersList", Array.from(onlineUsers.keys()));

    // The client still emits joinRoom on boot. Acknowledge it so nothing
    // breaks, but do not act on whatever id it passes.
    socket.on("joinRoom", () => {
      socket.emit("onlineUsersList", Array.from(onlineUsers.keys()));
    });

    /* ---------------- chat ---------------- */

    socket.on("joinChat", async (chatId: string) => {
      if (typeof chatId !== "string") return;
      if (actor.type !== "admin" && !(await isChatMember(chatId, actor.id))) return;
      socket.join(chatRoom(chatId));
    });

    socket.on("leaveChat", (chatId: string) => {
      if (typeof chatId === "string") socket.leave(chatRoom(chatId));
    });

    // Typing used to be broadcast to every connected client on the server, so
    // everybody saw an indicator whenever anybody anywhere typed.
    socket.on("typingChat", async (payload: { chatId?: string } = {}) => {
      const chatId = payload?.chatId;
      if (!chatId || !(await isChatMember(chatId, actor.id))) return;
      socket.to(chatRoom(chatId)).emit("typingChat", { chatId, userId: actor.id });
    });

    socket.on("stopTypingChat", async (payload: { chatId?: string } = {}) => {
      const chatId = payload?.chatId;
      if (!chatId) return;
      socket.to(chatRoom(chatId)).emit("stopTypingChat", { chatId, userId: actor.id });
    });

    socket.on("getUnreadCount", async () => {
      const count = await getUnreadCount(actor.id);
      socket.emit("totalUnReadChat", count);
    });

    socket.on("markMessagesSeen", async (payload: { chatId?: string } = {}) => {
      const chatId = payload?.chatId;
      if (!chatId || !(await isChatMember(chatId, actor.id))) return;

      await Message.updateMany(
        { chatId, sender: { $ne: actor.id }, status: { $ne: "seen" } },
        { $set: { status: "seen" }, $addToSet: { seenBy: actor.id } }
      );

      io.to(chatRoom(chatId)).emit("messagesSeen", { chatId, by: actor.id });
    });

    socket.on("messageSeen", async (payload: { chatId?: string } = {}) => {
      const chatId = payload?.chatId;
      if (!chatId || !(await isChatMember(chatId, actor.id))) return;

      try {
        await Message.updateMany(
          { chatId, sender: { $ne: actor.id } },
          { $addToSet: { seenBy: actor.id }, $set: { status: "seen" } }
        );

        // Only the most recent page is sent back. This used to return every
        // message in the conversation on every read receipt.
        const messages = await Message.find({ chatId, isDeleted: { $ne: true } })
          .sort({ createdAt: -1 })
          .limit(50)
          .populate("sender", "fullName profileImage")
          .populate("postId")
          .lean();

        io.to(chatRoom(chatId)).emit("messageSeen", { chatId, messages: messages.reverse(), by: actor.id });
      } catch (error) {
        logger.error({ err: error, chatId }, "messageSeen failed");
      }
    });

    /* ---------------- friend requests ---------------- */

    socket.on("unSeenFriendRequest", async (payload: { to?: string } = {}) => {
      // The sender is the actor; only the recipient is taken from the payload.
      const recipient =
        payload?.to ??
        (await FriendRequest.findOne({ from: actor.id }).sort({ createdAt: -1 }).select("to").lean())?.to?.toString();

      if (!recipient) return;

      const count = await FriendRequest.countDocuments({ to: recipient, statusSeen: "delivered" });
      io.to(roomFor(recipient)).emit("unSeenFriendRequest", count);
    });

    socket.on("friendRequestSeen", async () => {
      await FriendRequest.updateMany({ to: actor.id }, { statusSeen: "seen" });
      socket.emit("friendRequestSeen");
    });

    /* ---------------- notifications ---------------- */

    socket.on("notificationSeen", async () => {
      try {
        if (actor.type === "admin") {
          await Notification.updateMany(
            { type: { $in: [NotificationType.SUGGESTION, NotificationType.NEW_USER] }, isRead: false },
            { $set: { isRead: true } }
          );
        } else {
          await Notification.updateMany(
            { $or: [{ receiver: actor.id }, { type: NotificationType.ANNOUNCEMENT }], isRead: false },
            { $set: { isRead: true } }
          );
        }

        const notifications = await Notification.find({
          $or: [
            { receiver: actor.id },
            { type: NotificationType.ANNOUNCEMENT },
            ...(actor.type === "admin" ? [{ type: NotificationType.SUGGESTION }] : [])
          ]
        })
          .populate("sender", "fullName profileImage")
          .populate("receiver", "fullName profileImage")
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        socket.emit("notificationSeen", notifications);
      } catch (error) {
        logger.error({ err: error, actor: actor.id }, "notificationSeen failed");
      }
    });

    /* ---------------- admin ---------------- */

    socket.on("businessVerify", (userId: string) => {
      if (actor.type !== "admin" || typeof userId !== "string") return;
      io.to(roomFor(userId)).emit("businessVerify");
    });

    socket.on("interestedcandidateFromEvent", (payload: unknown) => {
      io.emit("interestedcandidateFromEvent", payload);
    });

    socket.on("adminMessageSeen", async (groupId: string) => {
      if (actor.type !== "admin" || typeof groupId !== "string") return;

      try {
        const chat = await Chat.findOne({ groupId }).select("_id").lean();

        if (chat) {
          await Message.updateMany({ chatId: chat._id, status: { $ne: "seen" } }, { $set: { status: "seen" } });
        }

        // Previously one findOne plus one find per group, inside Promise.all.
        // Two aggregate-free queries now cover every group at once.
        const groups = await Group.find().populate("members", "fullName email profileImage").sort({ createdAt: -1 }).lean();

        const chats = await Chat.find({ groupId: { $in: groups.map((group) => group._id) } })
          .select("_id groupId updatedAt")
          .lean();

        const chatByGroup = new Map(chats.map((entry) => [String(entry.groupId), entry]));

        const unreadCounts = await Message.aggregate([
          { $match: { chatId: { $in: chats.map((entry) => entry._id) }, status: { $ne: "seen" }, sender: { $ne: null } } },
          { $group: { _id: "$chatId", count: { $sum: 1 } } }
        ]);

        const unreadByChat = new Map(unreadCounts.map((entry) => [String(entry._id), entry.count as number]));

        const payload = groups.map((group) => {
          const groupChat = chatByGroup.get(String(group._id));
          return {
            ...group,
            chatId: groupChat?._id ?? null,
            unreadCount: groupChat ? (unreadByChat.get(String(groupChat._id)) ?? 0) : 0,
            updatedAt: groupChat?.updatedAt ?? group.updatedAt
          };
        });

        // Admins only, not every connected member.
        io.to(ADMIN_ROOM).emit("adminMessageSeen", payload);
      } catch (error) {
        logger.error({ err: error, groupId }, "adminMessageSeen failed");
      }
    });

    /* ---------------- disconnect ---------------- */

    socket.on("disconnect", async () => {
      const remaining = onlineUsers.get(actor.id);
      if (!remaining) return;

      remaining.delete(socket.id);
      if (remaining.size > 0) return;

      onlineUsers.delete(actor.id);

      /* Announce first, and through the server rather than the socket.
         `socket.broadcast.emit` after an `await` never arrived: by then this
         socket has been torn down, so there is nothing left to broadcast from.
         That is why members lit up when they came online but the dot only
         cleared on the next screen change. */
      io.emit("userOffline", actor.id);

      await markOnline(actor, false);
    });
  });

  return io;
};

export function getIO() {
  if (!io) throw new Error("Socket server is not initialised.");
  return io;
}

/** Emit to one account's room, wherever they are connected. */
export const emitToUser = (userId: string, event: string, payload?: unknown) => {
  getIO().to(roomFor(userId)).emit(event, payload);
};

/** Emit to every signed-in admin. */
export const emitToAdmins = (event: string, payload?: unknown) => {
  getIO().to(ADMIN_ROOM).emit(event, payload);
};

export const isUserOnline = (userId: string) => onlineUsers.has(userId);
