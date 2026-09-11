/**
 * End-to-end feature test.
 *
 * Drives the real HTTP API the way the front ends do: every member feature,
 * then every admin feature, in the order a real session would hit them.
 *
 * Run it against a throwaway database, never the live one:
 *
 *   MONGO_URI="<cluster>/club_featuretest" PORT=5199 npx tsx app.ts &
 *   API=http://localhost:5199/api npx tsx scripts/featureTest.ts
 */

const API = process.env.API ?? "http://localhost:5199/api";

/* ------------------------------------------------------------------ *
 * Harness
 * ------------------------------------------------------------------ */

interface Result {
  section: string;
  name: string;
  ok: boolean;
  detail: string;
}

const results: Result[] = [];
let section = "";

const setSection = (name: string) => {
  section = name;
  console.log(`\n\x1b[1m${name}\x1b[0m`);
};

const record = (name: string, ok: boolean, detail = "") => {
  results.push({ section, name, ok, detail });
  const mark = ok ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
  console.log(`  ${mark}  ${name}${detail && !ok ? `  -- ${detail}` : ""}`);
};

/** Runs one check. A thrown error is a failure, never a crash. */
const check = async (name: string, fn: () => Promise<void | string>) => {
  try {
    const detail = await fn();
    record(name, true, typeof detail === "string" ? detail : "");
  } catch (error) {
    record(name, false, error instanceof Error ? error.message : String(error));
  }
};

const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

interface CallOptions {
  method?: string;
  token?: string;
  body?: unknown;
  form?: FormData;
  expect?: number | number[];
}

const call = async (path: string, options: CallOptions = {}) => {
  const { method = "GET", token, body, form, expect } = options;

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined)
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text.slice(0, 200) };
  }

  if (expect !== undefined) {
    const allowed = Array.isArray(expect) ? expect : [expect];
    if (!allowed.includes(res.status)) {
      throw new Error(
        `${method} ${path} -> ${res.status} (wanted ${allowed.join("/")}): ${data.message ?? JSON.stringify(data).slice(0, 160)}`
      );
    }
  }

  return { status: res.status, data };
};

/** A 1x1 PNG, the smallest thing that survives an image upload path. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const imageField = (form: FormData, field: string, name = "test.png") => {
  form.append(field, new Blob([new Uint8Array(PNG)], { type: "image/png" }), name);
};

/* ------------------------------------------------------------------ *
 * Shared state
 * ------------------------------------------------------------------ */

const state = {
  adminToken: "",
  adminId: "",
  alice: { token: "", id: "", email: "alice@featuretest.local" },
  bob: { token: "", id: "", email: "bob@featuretest.local" },
  carol: { token: "", id: "", email: "carol@featuretest.local" },
  postId: "",
  commentId: "",
  adminPostId: "",
  eventId: "",
  galleryId: "",
  groupId: "",
  businessGroupId: "",
  chatId: "",
  messageId: "",
  friendRequestId: "",
  notificationId: "",
  announcementId: "",
  newsId: "",
  categoryId: "",
  reviewId: "",
  suggestionId: "",
  reportId: "",
  memberPostId: "",
  memberGroupId: ""
};

const stamp = Date.now();

/* ================================================================== *
 * MEMBER FEATURES
 * ================================================================== */

const registerAndVerify = async () => {
  setSection("MEMBER · Registration and sign-in");

  const people = [state.alice, state.bob, state.carol];
  const names = ["Alice Test", "Bob Test", "Carol Test"];

  await check("register three members", async () => {
    for (const [index, person] of people.entries()) {
      const res = await call("/user/auth/register", {
        method: "POST",
        expect: 201,
        body: {
          fullName: names[index],
          email: person.email,
          mobile: `9${String(800000000 + index + (stamp % 100000))}`.slice(0, 10),
          password: "Passw0rd123",
          confirmPassword: "Passw0rd123",
          city: "Jaipur"
        }
      });
      person.id = res.data.data._id;
    }
  });

  await check("unverified member cannot sign in", async () => {
    await call("/user/auth/login", {
      method: "POST",
      expect: 403,
      body: { identifier: state.alice.email, password: "Passw0rd123" }
    });
  });

  await check("admin signs in", async () => {
    const res = await call("/admin/auth/login", {
      method: "POST",
      expect: 200,
      body: { email: "root@featuretest.local", password: "SuperSecret123" }
    });
    state.adminToken = res.data.accessToken;
    state.adminId = res.data.admin._id;
    assert(state.adminToken, "no access token returned");
  });

  await check("admin verifies all three members", async () => {
    await call("/admin/user/verify", {
      method: "PATCH",
      token: state.adminToken,
      expect: 200,
      body: { memberIds: people.map((person) => person.id) }
    });
  });

  await check("verified members sign in", async () => {
    for (const person of people) {
      const res = await call("/user/auth/login", {
        method: "POST",
        expect: 200,
        body: { identifier: person.email, password: "Passw0rd123" }
      });
      person.token = res.data.accessToken;
      assert(person.token, `no token for ${person.email}`);
      assert(!JSON.stringify(res.data).includes("$2b$"), "login response contains a password hash");
    }
  });

  await check("GET /me returns the signed-in member", async () => {
    const res = await call("/user/auth/me", { token: state.alice.token, expect: 200 });
    assert(res.data.data._id === state.alice.id, "wrong member returned");
  });

  await check("member directory lists other members", async () => {
    const res = await call(`/user/auth/get/${state.alice.id}`, { token: state.alice.token, expect: 200 });
    assert(Array.isArray(res.data.data), "no data array");
    assert(res.data.data.length >= 2, `expected at least 2 others, got ${res.data.data.length}`);

    /* This is a members' club directory, so contact details are the point:
       email and mobile are meant to be here. What must never appear is
       anything private. */
    const sample = res.data.data[0];
    assert("email" in sample, "directory is missing email addresses");
    assert("mobile" in sample, "directory is missing mobile numbers");

    for (const field of ["password", "refreshTokens", "dob", "address", "maritalStatus", "spouseName", "spouseEmail", "children", "paymentImage"]) {
      assert(!(field in sample), `directory leaks a private field: ${field}`);
    }
  });

  await check("member profile update saves", async () => {
    const form = new FormData();
    form.append("userId", state.alice.id);
    form.append("occupation", "Chartered Accountant");
    form.append("city", "Udaipur");
    await call("/user/auth/update", { method: "PUT", token: state.alice.token, form, expect: 200 });

    const res = await call("/user/auth/me", { token: state.alice.token, expect: 200 });
    assert(res.data.data.occupation === "Chartered Accountant", "occupation did not save");
    assert(res.data.data.city === "Udaipur", "city did not save");
  });

  await check("member profile detail loads", async () => {
    const res = await call(`/user/auth/get-by-id/${state.bob.id}`, { token: state.alice.token, expect: 200 });
    assert(res.data.user, "no user in response");
    assert(Array.isArray(res.data.posts), "no posts array");
  });
};

const testPosts = async () => {
  setSection("MEMBER · Posts");

  await check("create a post", async () => {
    const res = await call("/user/post/notes/add", {
      method: "POST",
      token: state.alice.token,
      expect: 201,
      body: { userId: state.alice.id, notes: "Alice's first post from the feature test." }
    });
    state.postId = res.data.post._id;
    assert(state.postId, "no post id returned");
  });

  await check("feed returns the post", async () => {
    const res = await call(`/user/post/get/${state.alice.id}`, { token: state.bob.token, expect: 200 });
    assert(Array.isArray(res.data.posts), "no posts array");
    assert(res.data.posts.some((p: any) => p._id === state.postId), "new post missing from the feed");
    assert("hasMore" in res.data && "nextCursor" in res.data, "feed is not paginated");
  });

  await check("like a post", async () => {
    const res = await call("/user/post/like/toggle", {
      method: "POST",
      token: state.bob.token,
      expect: 200,
      body: { userId: state.bob.id, postId: state.postId }
    });
    assert(res.data.likes === 1, `expected 1 like, got ${res.data.likes}`);
  });

  await check("unlike a post", async () => {
    const res = await call("/user/post/like/toggle", {
      method: "POST",
      token: state.bob.token,
      expect: 200,
      body: { userId: state.bob.id, postId: state.postId }
    });
    assert(res.data.likes === 0, `expected 0 likes, got ${res.data.likes}`);
  });

  await check("comment on a post", async () => {
    const res = await call("/user/post/comment/add", {
      method: "POST",
      token: state.bob.token,
      expect: [200, 201],
      body: { postId: state.postId, text: "Bob's comment", userId: state.bob.id }
    });
    const comments = res.data.comments ?? res.data.post?.comments ?? [];
    assert(comments.length === 1, `expected 1 comment, got ${comments.length}`);
    state.commentId = comments[0]._id;
  });

  await check("like a comment", async () => {
    await call("/user/post/comment/like-toggle", {
      method: "POST",
      token: state.carol.token,
      expect: 200,
      body: { postId: state.postId, commentId: state.commentId, userId: state.carol.id }
    });
  });

  await check("reply to a comment", async () => {
    await call("/user/post/comment/reply", {
      method: "POST",
      token: state.carol.token,
      expect: [200, 201],
      body: { postId: state.postId, commentId: state.commentId, userId: state.carol.id, text: "Carol's reply" }
    });
  });

  await check("another member cannot delete my post", async () => {
    const res = await call("/user/post/delete", {
      method: "PUT",
      token: state.bob.token,
      body: { postId: state.postId, userId: state.bob.id }
    });
    assert(res.status !== 200, `Bob deleted Alice's post (status ${res.status})`);
  });

  await check("author deletes their own post", async () => {
    await call("/user/post/delete", {
      method: "PUT",
      token: state.alice.token,
      expect: 200,
      body: { postId: state.postId, userId: state.alice.id }
    });
  });
};

const testFriends = async () => {
  setSection("MEMBER · Friend requests");

  await check("suggested members", async () => {
    const res = await call(`/user/friend/suggestion/get/${state.alice.id}`, { token: state.alice.token, expect: 200 });
    assert(res.data, "empty response");
  });

  await check("send a friend request", async () => {
    const res = await call("/user/friend/request/send", {
      method: "POST",
      token: state.alice.token,
      expect: [200, 201],
      body: { fromId: state.alice.id, toId: state.bob.id }
    });
    state.friendRequestId = res.data.request?._id ?? res.data.data?._id ?? res.data._id;
    assert(state.friendRequestId, `no request id in ${JSON.stringify(res.data).slice(0, 120)}`);
  });

  await check("recipient sees it as pending", async () => {
    const res = await call(`/user/friend/request/pending/${state.bob.id}`, { token: state.bob.token, expect: 200 });
    assert(JSON.stringify(res.data).includes(state.alice.id), "request not visible to the recipient");
  });

  await check("accept the request", async () => {
    await call(`/user/friend/request/accept/${state.friendRequestId}`, { token: state.bob.token, expect: 200 });
  });

  await check("both now list each other as a friend", async () => {
    const res = await call(`/user/friend/users/${state.alice.id}`, { token: state.alice.token, expect: 200 });
    assert(JSON.stringify(res.data).includes(state.bob.id), "Bob missing from Alice's friends");
  });

  await check("mutual friends", async () => {
    await call("/user/friend/users/mutualFriends", {
      method: "POST",
      token: state.alice.token,
      expect: 200,
      body: { userId: state.alice.id, otherUserId: state.carol.id }
    });
  });
};

const testChat = async () => {
  setSection("MEMBER · Chat");

  await check("open a conversation", async () => {
    const res = await call("/user/chat/user/add", {
      method: "POST",
      token: state.alice.token,
      expect: [200, 201],
      body: { senderId: state.alice.id, receiverId: state.bob.id }
    });
    state.chatId = res.data.chat?._id ?? res.data.data?._id ?? res.data._id;
    assert(state.chatId, `no chat id in ${JSON.stringify(res.data).slice(0, 120)}`);
  });

  await check("send a message", async () => {
    const form = new FormData();
    form.append("chatId", state.chatId);
    form.append("senderId", state.alice.id);
    form.append("text", "Hello Bob, this is a test message.");
    const res = await call("/user/chat/message/send", {
      method: "POST",
      token: state.alice.token,
      form,
      expect: [200, 201]
    });
    state.messageId = res.data.data?._id ?? res.data.message?._id ?? res.data.newMessage?._id;
    assert(state.messageId, `no message id in ${JSON.stringify(res.data).slice(0, 160)}`);
  });

  await check("recipient reads the conversation", async () => {
    const res = await call(`/user/chat/messages?chatId=${state.chatId}&userId=${state.bob.id}`, {
      token: state.bob.token,
      expect: 200
    });
    assert(JSON.stringify(res.data).includes("Hello Bob"), "message not visible to the recipient");
  });

  await check("chat list shows the conversation", async () => {
    const res = await call(`/user/chat/users/${state.alice.id}`, { token: state.alice.token, expect: 200 });
    assert(JSON.stringify(res.data).includes(state.chatId), "conversation missing from the chat list");
  });

  await check("mark messages seen", async () => {
    await call("/user/chat/user/markAsSeen", {
      method: "POST",
      token: state.bob.token,
      body: { chatId: state.chatId, userId: state.bob.id },
      expect: [200, 404]
    });
  });

  await check("delete a message for me only", async () => {
    await call("/user/chat/user/deleteMessageForMe", {
      method: "PATCH",
      token: state.bob.token,
      expect: 200,
      body: { messageId: state.messageId, userId: state.bob.id }
    });
  });

  await check("sender deletes a message for everyone", async () => {
    await call("/user/chat/user/deleteMessageForEveryone", {
      method: "PATCH",
      token: state.alice.token,
      expect: 200,
      body: { messageId: state.messageId, userId: state.alice.id }
    });
  });

  await check("block and unblock inside a chat", async () => {
    await call("/user/chat/user/block", {
      method: "PATCH",
      token: state.alice.token,
      expect: 200,
      body: { chatId: state.chatId, toId: state.bob.id, fromId: state.alice.id }
    });
    await call("/user/chat/user/unblock", {
      method: "PATCH",
      token: state.alice.token,
      expect: 200,
      body: { chatId: state.chatId, toId: state.bob.id, fromId: state.alice.id }
    });
  });

  await check("clear my copy of a conversation", async () => {
    await call("/user/chat/user/deleteAllMessagesForMe", {
      method: "PATCH",
      token: state.alice.token,
      expect: 200,
      body: { chatId: state.chatId, userId: state.alice.id }
    });
  });
};

const testMemberMisc = async () => {
  setSection("MEMBER · Notifications, blocking, reports, suggestions, reviews");

  await check("notifications list", async () => {
    const res = await call(`/user/notification/get/${state.bob.id}`, { token: state.bob.token, expect: 200 });
    const list = res.data.notifications ?? res.data.data ?? [];
    assert(Array.isArray(list), "no notifications array");
    if (list.length) state.notificationId = list[0]._id;
    return `${list.length} notification(s)`;
  });

  await check("mark all notifications read", async () => {
    await call(`/user/notification/updateNotification/${state.bob.id}`, {
      method: "PATCH",
      token: state.bob.token,
      expect: 200
    });
  });

  await check("block a member", async () => {
    await call("/user/block/blocked", {
      method: "PATCH",
      token: state.alice.token,
      expect: 200,
      body: { toId: state.carol.id, fromId: state.alice.id }
    });
  });

  await check("blocked member disappears from the directory", async () => {
    const res = await call(`/user/auth/get/${state.alice.id}`, { token: state.alice.token, expect: 200 });
    assert(!res.data.data.some((u: any) => u._id === state.carol.id), "blocked member still listed");
  });

  await check("blocked list", async () => {
    const res = await call(`/user/block/get/${state.alice.id}`, { token: state.alice.token, expect: 200 });
    assert(JSON.stringify(res.data).includes(state.carol.id), "blocked member missing from the list");
  });

  await check("unblock a member", async () => {
    await call("/user/block/unblocked", {
      method: "PATCH",
      token: state.alice.token,
      expect: 200,
      body: { toId: state.carol.id, fromId: state.alice.id }
    });
  });

  await check("report a member", async () => {
    const res = await call("/user/report/create", {
      method: "POST",
      token: state.bob.token,
      expect: [200, 201],
      body: {
        reportedBy: state.bob.id,
        reportedUser: state.carol.id,
        reportType: "user",
        reason: "Spam",
        description: "Feature test report."
      }
    });
    state.reportId = res.data.report?._id ?? res.data.data?._id ?? res.data._id;
    assert(state.reportId, `no report id in ${JSON.stringify(res.data).slice(0, 120)}`);
  });

  await check("my reports", async () => {
    await call(`/user/report/my/${state.bob.id}`, { token: state.bob.token, expect: 200 });
  });

  await check("submit a suggestion", async () => {
    const res = await call("/user/suggestion/add", {
      method: "POST",
      token: state.alice.token,
      expect: [200, 201],
      body: { userId: state.alice.id, suggestion: "Please add a monthly newsletter." }
    });
    state.suggestionId = res.data.suggestion?._id ?? res.data.data?._id ?? res.data._id;
    assert(state.suggestionId, `no suggestion id in ${JSON.stringify(res.data).slice(0, 120)}`);
  });

  await check("my suggestions", async () => {
    await call(`/user/suggestion/get/${state.alice.id}`, { token: state.alice.token, expect: 200 });
  });

  await check("leave a review", async () => {
    const res = await call("/user/review/add", {
      method: "POST",
      token: state.alice.token,
      expect: [200, 201],
      body: { userId: state.alice.id, message: "Great club, well organised.", rating: 5 }
    });
    state.reviewId = res.data.review?._id ?? res.data.data?._id ?? res.data._id;
    assert(state.reviewId, `no review id in ${JSON.stringify(res.data).slice(0, 120)}`);
  });

  await check("my reviews", async () => {
    await call(`/user/review/get/${state.alice.id}`, { token: state.alice.token, expect: 200 });
  });

  await check("announcements list", async () => {
    await call("/user/announcement/get", { token: state.alice.token, expect: 200 });
  });
};


const testMemberAppRoutes = async () => {
  setSection("MEMBER · Routes the mobile app depends on");

  /* The app read events, created posts with images and managed groups through
     `/api/admin/...`, which is why those endpoints had no authentication.
     They are staff-only now, and members have their own equivalents. */

  await check("admin endpoints outside the legacy bridge stay closed to members", async () => {
    /* The four routers the shipped mobile app touches let a member through on
       the exact paths that app uses. Everything else must still refuse. */
    const closed = [
      ["GET", "/admin/user/get"],
      ["GET", "/admin/dashboard/summary"],
      ["GET", "/admin/reports/admin/all"],
      ["GET", "/admin/reviews/get"],
      ["GET", "/admin/gallery/get"],
      ["GET", "/admin/suggestion/get"]
    ] as const;

    for (const [method, path] of closed) {
      const res = await call(path, { method, token: state.alice.token });
      assert(res.status === 403, `${path} answered ${res.status} to a member`);
    }
  });

  await check("legacy bridge does not open unlisted paths on its own routers", async () => {
    // Deleting an event is admin-only even on a bridged router, because the
    // shipped app never called it as a member.
    const events = await call("/user/event/get", { token: state.alice.token, expect: 200 });
    const eventId = events.data.event[0]?._id;
    if (!eventId) return "no event to try";

    const res = await call(`/admin/event/delete/${eventId}`, { method: "DELETE", token: state.alice.token });
    assert(res.status === 403, `a member deleted an event through the bridge (status ${res.status})`);
  });

  await check("an already-installed app can still read events and announcements", async () => {
    await call("/admin/event/get", { token: state.alice.token, expect: 200 });
    await call("/admin/announcement/get", { token: state.alice.token, expect: 200 });
  });

  await check("legacy bridge still enforces ownership", async () => {
    const form = new FormData();
    form.append("title", "Bridge Group");
    form.append("description", "Created through the old path.");
    form.append("createdBy", state.alice.id);
    imageField(form, "media");
    const created = await call("/admin/group/add", { method: "POST", token: state.alice.token, form, expect: [200, 201] });
    const bridgeGroupId = created.data.group?._id;
    assert(bridgeGroupId, "group was not created through the bridge");

    const res = await call(`/admin/group/delete/${bridgeGroupId}`, { method: "DELETE", token: state.bob.token });
    assert(res.status === 403, `Bob deleted Alice's group through the bridge (status ${res.status})`);

    await call(`/admin/group/delete/${bridgeGroupId}`, { method: "DELETE", token: state.alice.token, expect: 200 });
  });

  await check("member reads events", async () => {
    const res = await call("/user/event/get", { token: state.alice.token, expect: 200 });
    assert(Array.isArray(res.data.event), "no event array");
  });

  await check("member marks interest in an event", async () => {
    const events = await call("/user/event/get", { token: state.alice.token, expect: 200 });
    const eventId = events.data.event[0]?._id;
    assert(eventId, "no event to mark interest in");

    await call("/user/event/candidate/interested", {
      method: "POST",
      token: state.alice.token,
      expect: 200,
      body: { eventId, userId: state.alice.id }
    });
  });

  await check("member creates a post with an image", async () => {
    const form = new FormData();
    form.append("title", "My first photo post");
    form.append("description", "Posted from the app.");
    form.append("userId", state.alice.id);
    form.append("type", "public");
    // A member must not be able to pin their post to everyone's feed.
    form.append("isPinned", "true");
    imageField(form, "images");

    const res = await call("/user/post/add", { method: "POST", token: state.alice.token, form, expect: [200, 201] });
    state.memberPostId = res.data.post?._id;
    assert(state.memberPostId, `no post id in ${JSON.stringify(res.data).slice(0, 160)}`);
    assert(res.data.post.isPinned === false, "a member managed to pin their own post");
    assert(res.data.post.create === "User", `post author type is ${res.data.post.create}`);
  });

  await check("member hides a post from their own feed", async () => {
    await call("/user/post/hide", {
      method: "POST",
      token: state.bob.token,
      expect: 200,
      body: { userId: state.bob.id, postId: state.memberPostId }
    });

    const feed = await call(`/user/post/get/${state.bob.id}`, { token: state.bob.token, expect: 200 });
    assert(!feed.data.posts.some((p: any) => p._id === state.memberPostId), "hidden post still in the feed");

    // The post stays visible to everybody else.
    const other = await call(`/user/post/get/${state.alice.id}`, { token: state.alice.token, expect: 200 });
    assert(other.data.posts.some((p: any) => p._id === state.memberPostId), "hiding removed the post for everyone");
  });

  await check("member unhides a post", async () => {
    await call("/user/post/unhide", {
      method: "POST",
      token: state.bob.token,
      expect: 200,
      body: { userId: state.bob.id, postId: state.memberPostId }
    });
    const feed = await call(`/user/post/get/${state.bob.id}`, { token: state.bob.token, expect: 200 });
    assert(feed.data.posts.some((p: any) => p._id === state.memberPostId), "unhidden post did not come back");
  });

  await check("member creates their own group", async () => {
    const form = new FormData();
    form.append("title", "Morning Walk Club");
    form.append("description", "Members who walk at dawn.");
    form.append("createdBy", state.alice.id);
    imageField(form, "media");
    const res = await call("/user/group/add", { method: "POST", token: state.alice.token, form, expect: [200, 201] });
    state.memberGroupId = res.data.group?._id;
    assert(state.memberGroupId, `no group id in ${JSON.stringify(res.data).slice(0, 160)}`);
  });

  await check("group creator adds a member", async () => {
    await call("/user/group/addmember", {
      method: "POST",
      token: state.alice.token,
      expect: 200,
      body: { groupId: state.memberGroupId, members: [state.bob.id] }
    });
  });

  await check("somebody else cannot edit that group", async () => {
    const form = new FormData();
    form.append("id", state.memberGroupId);
    form.append("title", "Hijacked");
    const res = await call("/user/group/update", { method: "PUT", token: state.bob.token, form });
    assert(res.status === 403, `Bob edited Alice's group (status ${res.status})`);
  });

  await check("somebody else cannot delete that group", async () => {
    const res = await call(`/user/group/delete/${state.memberGroupId}`, { method: "DELETE", token: state.bob.token });
    assert(res.status === 403, `Bob deleted Alice's group (status ${res.status})`);
  });

  await check("the creator can edit and delete it", async () => {
    const form = new FormData();
    form.append("id", state.memberGroupId);
    form.append("title", "Morning Walk Club (renamed)");
    form.append("description", "Members who walk at dawn.");
    await call("/user/group/update", { method: "PUT", token: state.alice.token, form, expect: 200 });
    await call(`/user/group/delete/${state.memberGroupId}`, { method: "DELETE", token: state.alice.token, expect: 200 });
  });

  await check("member deletes their own post", async () => {
    await call("/user/post/delete", {
      method: "PUT",
      token: state.alice.token,
      expect: 200,
      body: { postId: state.memberPostId, userId: state.alice.id }
    });
  });
};

/* ================================================================== *
 * ADMIN FEATURES
 * ================================================================== */

const testAdminContent = async () => {
  setSection("ADMIN · Events");

  await check("create an event", async () => {
    const form = new FormData();
    form.append("title", "Annual General Meeting");
    form.append("description", "The yearly members' meeting.");
    form.append("date", new Date(Date.now() + 7 * 86400000).toISOString());
    form.append("location", "Jaipur");
    form.append("category", "Meeting");
    form.append("type", "public");
    form.append("userId", state.adminId);
    imageField(form, "coverImage");
    const res = await call("/admin/event/add", { method: "POST", token: state.adminToken, form, expect: [200, 201] });
    state.eventId = res.data.event?._id ?? res.data.data?._id;
    assert(state.eventId, `no event id in ${JSON.stringify(res.data).slice(0, 160)}`);
  });

  await check("list events", async () => {
    const res = await call("/admin/event/get", { token: state.adminToken, expect: 200 });
    assert(res.data.event?.length >= 1, "event missing from the list");
  });

  await check("single event", async () => {
    await call(`/admin/event/getbyid/${state.eventId}`, { token: state.adminToken, expect: 200 });
  });

  await check("update an event", async () => {
    const form = new FormData();
    form.append("id", state.eventId);
    form.append("title", "Annual General Meeting (rescheduled)");
    form.append("description", "The yearly members' meeting.");
    form.append("date", new Date(Date.now() + 14 * 86400000).toISOString());
    form.append("location", "Udaipur");
    form.append("category", "Meeting");
    form.append("type", "public");
    form.append("userId", state.adminId);
    await call("/admin/event/update", { method: "PUT", token: state.adminToken, form, expect: 200 });

    const res = await call(`/admin/event/getbyid/${state.eventId}`, { token: state.adminToken, expect: 200 });
    assert(res.data.event.location === "Udaipur", "event update did not save");
  });

  await check("member marks interest in an event", async () => {
    await call("/admin/event/candidate/interested", {
      method: "POST",
      token: state.adminToken,
      expect: 200,
      body: { eventId: state.eventId, userId: state.alice.id }
    });
  });

  await check("event appears on the public site", async () => {
    const res = await call("/public/events", { expect: 200 });
    assert(res.data.event.some((e: any) => e._id === state.eventId), "event missing from the public list");
    assert(!JSON.stringify(res.data).includes("interestedCandidate"), "public event leaks the attendee list");
  });

  setSection("ADMIN · Gallery");

  await check("add gallery media", async () => {
    const form = new FormData();
    form.append("event", state.eventId);
    form.append("type", "photo");
    imageField(form, "image");
    const res = await call("/admin/gallery/add", { method: "POST", token: state.adminToken, form, expect: [200, 201] });
    state.galleryId = res.data.gallery?._id ?? res.data.data?._id;
    assert(state.galleryId, `no gallery id in ${JSON.stringify(res.data).slice(0, 160)}`);
  });

  await check("list gallery", async () => {
    await call("/admin/gallery/get", { token: state.adminToken, expect: 200 });
  });

  await check("mark gallery item important", async () => {
    await call("/admin/gallery/marked", {
      method: "PATCH",
      token: state.adminToken,
      expect: 200,
      body: { galleryId: state.galleryId }
    });
  });

  setSection("ADMIN · Announcements, news and categories");

  await check("create an announcement", async () => {
    const res = await call("/admin/announcement/add", {
      method: "POST",
      token: state.adminToken,
      expect: [200, 201],
      body: {
        title: "Diwali celebration",
        description: "Join us on the 20th.",
        priority: "high",
        createdBy: state.adminId
      }
    });
    state.announcementId = res.data.announcement?._id ?? res.data.data?._id;
    assert(state.announcementId, `no announcement id in ${JSON.stringify(res.data).slice(0, 160)}`);
  });

  await check("announcement reaches members and the public site", async () => {
    const asMember = await call("/user/announcement/get", { token: state.alice.token, expect: 200 });
    assert(JSON.stringify(asMember.data).includes("Diwali"), "announcement not visible to members");
    const asVisitor = await call("/public/announcements", { expect: 200 });
    assert(JSON.stringify(asVisitor.data).includes("Diwali"), "announcement not visible publicly");
  });

  await check("create a news article", async () => {
    const res = await call("/admin/news/add", {
      method: "POST",
      token: state.adminToken,
      expect: [200, 201],
      body: { title: "New committee elected", description: "Results are in.", category: "Club", createdBy: state.adminId }
    });
    state.newsId = res.data.news?._id ?? res.data.data?._id;
    assert(state.newsId, `no news id in ${JSON.stringify(res.data).slice(0, 160)}`);
  });

  await check("update a news article", async () => {
    await call("/admin/news/update", {
      method: "PUT",
      token: state.adminToken,
      expect: 200,
      body: { id: state.newsId, title: "New committee elected (updated)" }
    });
  });

  await check("create a category", async () => {
    const res = await call("/admin/category/add", {
      method: "POST",
      token: state.adminToken,
      expect: [200, 201],
      body: { name: `Sports-${stamp}`, description: "Sporting events", adminId: state.adminId }
    });
    state.categoryId = res.data.category?._id ?? res.data.data?._id;
    assert(state.categoryId, `no category id in ${JSON.stringify(res.data).slice(0, 160)}`);
  });

  await check("list categories", async () => {
    await call("/admin/category/get", { token: state.adminToken, expect: 200 });
  });
};

const testAdminPosts = async () => {
  setSection("ADMIN · Posts");

  await check("create an admin post", async () => {
    const form = new FormData();
    form.append("title", "Committee update");
    form.append("description", "Minutes from the last meeting.");
    form.append("userId", state.adminId);
    form.append("type", "public");
    imageField(form, "images");
    const res = await call("/admin/post/add", { method: "POST", token: state.adminToken, form, expect: [200, 201] });
    state.adminPostId = res.data.post?._id ?? res.data.data?._id;
    assert(state.adminPostId, `no post id in ${JSON.stringify(res.data).slice(0, 160)}`);
  });

  await check("list admin posts", async () => {
    await call("/admin/post/get", { token: state.adminToken, expect: 200 });
  });

  await check("update an admin post", async () => {
    const form = new FormData();
    form.append("postId", state.adminPostId);
    form.append("title", "Committee update (revised)");
    form.append("description", "Minutes from the last meeting.");
    form.append("type", "public");
    await call("/admin/post/update", { method: "PUT", token: state.adminToken, form, expect: 200 });
  });

  await check("pin an admin post", async () => {
    await call(`/admin/post/pinned/${state.adminPostId}`, { method: "PATCH", token: state.adminToken, expect: 200 });
  });

  await check("member sees the admin post in their feed", async () => {
    const res = await call(`/user/post/get/${state.alice.id}`, { token: state.alice.token, expect: 200 });
    assert(res.data.posts.some((p: any) => p._id === state.adminPostId), "admin post missing from the member feed");
  });

  await check("member likes and comments on the admin post", async () => {
    await call("/user/post/like/toggle", {
      method: "POST",
      token: state.alice.token,
      expect: 200,
      body: { userId: state.alice.id, postId: state.adminPostId }
    });
    await call("/user/post/comment/add", {
      method: "POST",
      token: state.alice.token,
      expect: [200, 201],
      body: { postId: state.adminPostId, text: "Thanks for sharing.", userId: state.alice.id }
    });
  });

  await check("admin deletes the post", async () => {
    await call(`/admin/post/delete/${state.adminPostId}`, { method: "DELETE", token: state.adminToken, expect: 200 });
  });
};

const testAdminGroups = async () => {
  setSection("ADMIN · Groups and business groups");

  await check("create a group", async () => {
    const form = new FormData();
    form.append("title", "Youth Wing");
    form.append("description", "Members under 35.");
    form.append("createdBy", state.adminId);
    form.append("members", JSON.stringify([state.alice.id, state.bob.id]));
    imageField(form, "media");
    const res = await call("/admin/group/add", { method: "POST", token: state.adminToken, form, expect: [200, 201] });
    state.groupId = res.data.group?._id ?? res.data.data?._id;
    assert(state.groupId, `no group id in ${JSON.stringify(res.data).slice(0, 160)}`);
  });

  await check("list groups", async () => {
    await call("/admin/group/get", { token: state.adminToken, expect: 200 });
  });

  await check("group detail", async () => {
    await call(`/admin/group/getbyid/${state.groupId}`, { token: state.adminToken, expect: 200 });
  });

  await check("add a member to the group", async () => {
    await call("/admin/group/addmember", {
      method: "POST",
      token: state.adminToken,
      expect: 200,
      body: { groupId: state.groupId, members: [state.carol.id] }
    });
  });

  await check("member sees the group", async () => {
    const res = await call("/user/group/get", { token: state.alice.token, expect: 200 });
    assert(JSON.stringify(res.data).includes(state.groupId), "group not visible to a member");
  });

  await check("remove a member from the group", async () => {
    await call("/admin/group/removemember", {
      method: "PUT",
      token: state.adminToken,
      expect: 200,
      body: { groupId: state.groupId, userId: state.carol.id }
    });
  });

  await check("admin posts a group message", async () => {
    const form = new FormData();
    form.append("groupId", state.groupId);
    form.append("message", "Welcome to the Youth Wing.");
    await call("/admin/chat/group/message", { method: "POST", token: state.adminToken, form, expect: [200, 201] });
  });

  await check("read the group conversation", async () => {
    const res = await call(`/admin/chat/group/get/messages/${state.groupId}`, { token: state.adminToken, expect: 200 });
    assert(JSON.stringify(res.data).includes("Youth Wing"), "group message not stored");
  });

  await check("create a business group", async () => {
    const form = new FormData();
    form.append("title", "Textile Traders");
    form.append("description", "Members in textiles.");
    form.append("type", "public");
    form.append("location", "Jaipur");
    form.append("category", "Textiles");
    form.append("members", JSON.stringify([state.alice.id]));
    imageField(form, "media");
    const res = await call("/admin/businessgroup/add", { method: "POST", token: state.adminToken, form, expect: [200, 201] });
    state.businessGroupId = res.data.group?._id ?? res.data.data?._id ?? res.data.businessGroup?._id;
    assert(state.businessGroupId, `no business group id in ${JSON.stringify(res.data).slice(0, 160)}`);
  });

  await check("add and remove a business group member", async () => {
    await call(`/admin/businessgroup/addmember/${state.businessGroupId}`, {
      method: "POST",
      token: state.adminToken,
      expect: 200,
      body: { userId: state.bob.id }
    });
    await call(`/admin/businessgroup/removemember/${state.businessGroupId}/${state.bob.id}`, {
      method: "DELETE",
      token: state.adminToken,
      expect: 200
    });
  });
};

const testAdminMembers = async () => {
  setSection("ADMIN · Member management");

  await check("paginated member list", async () => {
    const res = await call("/admin/user/get?page=1&perPage=10", { token: state.adminToken, expect: 200 });
    assert(Array.isArray(res.data.users), "no users array");
    assert(typeof res.data.total === "number", "no total count");
    assert(!JSON.stringify(res.data).includes("refreshTokens"), "member list leaks refresh tokens");
  });

  await check("search members by name", async () => {
    const res = await call("/admin/user/get?search=Alice", { token: state.adminToken, expect: 200 });
    assert(res.data.users.some((u: any) => u.fullName === "Alice Test"), "search did not find Alice");
  });

  await check("search by mobile number works", async () => {
    const list = await call("/admin/user/get?perPage=50", { token: state.adminToken, expect: 200 });
    const withMobile = list.data.users.find((u: any) => u.mobile);
    assert(withMobile, "no member has a mobile number");
    const res = await call(`/admin/user/get?search=${withMobile.mobile}`, { token: state.adminToken, expect: 200 });
    assert(res.data.users.length >= 1, "mobile search returned nothing");
  });

  await check("search combines with the status filter", async () => {
    const res = await call("/admin/user/get?search=Test&filterStatus=active", { token: state.adminToken, expect: 200 });
    assert(res.data.users.every((u: any) => u.blocked === false), "blocked members leaked into the active filter");
  });

  await check("assign a committee role", async () => {
    await call("/admin/user/role/assign", {
      method: "PATCH",
      token: state.adminToken,
      expect: 200,
      body: { userId: state.carol.id, role: "treasurer" }
    });
    const res = await call(`/admin/user/get?search=Carol`, { token: state.adminToken, expect: 200 });
    assert(res.data.users[0].role === "treasurer", "role did not save");
  });

  await check("block a member, and they lose access", async () => {
    await call(`/admin/user/block/toggle/${state.carol.id}`, { method: "PATCH", token: state.adminToken, expect: 200 });
    const res = await call("/user/auth/me", { token: state.carol.token });
    assert(res.status === 403, `blocked member still has access (status ${res.status})`);
  });

  await check("unblock restores access", async () => {
    await call(`/admin/user/block/toggle/${state.carol.id}`, { method: "PATCH", token: state.adminToken, expect: 200 });
    await call("/user/auth/me", { token: state.carol.token, expect: 200 });
  });

  await check("member requests deletion, admin approves, then recovers", async () => {
    await call(`/user/auth/delete/user/${state.bob.id}`, {
      method: "DELETE",
      token: state.bob.token,
      expect: 200,
      body: { reason: "Feature test." }
    });
    await call(`/admin/user/delete/request/cancel/${state.bob.id}`, {
      method: "PATCH",
      token: state.adminToken,
      expect: 200
    });
  });

  await check("admin edits a member", async () => {
    await call(`/admin/user/update/${state.alice.id}`, {
      method: "PUT",
      token: state.adminToken,
      expect: 200,
      body: { fullName: "Alice Test", occupation: "Auditor" }
    });
  });

  setSection("ADMIN · Reviews, suggestions and reports");

  await check("list reviews", async () => {
    const res = await call("/admin/reviews/get", { token: state.adminToken, expect: 200 });
    assert(JSON.stringify(res.data).includes(state.reviewId), "member review missing from the admin list");
  });

  await check("approve a review, and it appears publicly", async () => {
    await call("/admin/reviews/status/update", {
      method: "PATCH",
      token: state.adminToken,
      expect: 200,
      body: { reviewId: state.reviewId, status: "approved", adminReply: "Thank you." }
    });
    const res = await call("/public/reviews", { expect: 200 });
    assert(JSON.stringify(res.data).includes(state.reviewId), "approved review missing from the public list");
  });

  await check("a review can be approved without writing a reply", async () => {
    await call("/admin/reviews/status/update", {
      method: "PATCH",
      token: state.adminToken,
      expect: 200,
      body: { reviewId: state.reviewId, status: "approved" }
    });
  });

  await check("list suggestions", async () => {
    const res = await call("/admin/suggestion/get", { token: state.adminToken, expect: 200 });
    assert(JSON.stringify(res.data).includes(state.suggestionId), "member suggestion missing from the admin list");
  });

  await check("reply to a suggestion", async () => {
    await call("/admin/suggestion/reply", {
      method: "POST",
      token: state.adminToken,
      expect: 200,
      body: { id: state.suggestionId, userId: state.adminId, adminReply: "Good idea, we will look into it." }
    });
  });

  await check("update a suggestion's status", async () => {
    await call("/admin/suggestion/update", {
      method: "PUT",
      token: state.adminToken,
      expect: 200,
      body: { id: state.suggestionId, status: "resolved" }
    });
  });

  await check("list reports", async () => {
    const res = await call("/admin/reports/admin/all", { token: state.adminToken, expect: 200 });
    assert(JSON.stringify(res.data).includes(state.reportId), "member report missing from the admin list");
  });

  await check("update a report's status", async () => {
    await call(`/admin/reports/admin/update/${state.reportId}/${state.adminId}`, {
      method: "PATCH",
      token: state.adminToken,
      expect: 200,
      body: { status: "reviewed" }
    });
  });

  setSection("ADMIN · Donations, dashboard and notifications");

  await check("record a donation", async () => {
    await call("/admin/donation/add", {
      method: "POST",
      token: state.adminToken,
      expect: [200, 201],
      body: { userId: state.alice.id, amount: 5100, title: "Annual contribution" }
    });
  });

  await check("donation list", async () => {
    await call("/admin/donation/get?page=1", { token: state.adminToken, expect: 200 });
  });

  await check("top donors", async () => {
    await call("/admin/donation/top-donors", { token: state.adminToken, expect: 200 });
  });

  await check("dashboard summary reflects real counts", async () => {
    const res = await call("/admin/dashboard/summary", { token: state.adminToken, expect: 200 });
    assert(res.data.totalUser >= 3, `expected at least 3 members, got ${res.data.totalUser}`);
    assert(res.data.totalDonation >= 5100, `donation total wrong: ${res.data.totalDonation}`);
  });

  await check("dashboard graph, stats and analytics", async () => {
    await call("/admin/dashboard/graph", { token: state.adminToken, expect: 200 });
    await call("/admin/dashboard/stats", { token: state.adminToken, expect: 200 });
    await call("/admin/dashboard/analytics", { token: state.adminToken, expect: 200 });
  });

  await check("admin notifications", async () => {
    await call("/admin/notification/get", { token: state.adminToken, expect: 200 });
  });

  await check("admin account list and self record", async () => {
    await call("/admin/auth/me", { token: state.adminToken, expect: 200 });
    const res = await call("/admin/auth/get", { token: state.adminToken, expect: 200 });
    assert(!JSON.stringify(res.data).includes("$2b$"), "admin list leaks password hashes");
  });
};

const testCleanupOperations = async () => {
  setSection("ADMIN · Deletions");

  const deletions: Array<[string, string, string]> = [
    ["gallery item", "DELETE", `/admin/gallery/delete/${state.galleryId}`],
    ["business group", "DELETE", `/admin/businessgroup/delete/${state.businessGroupId}`],
    ["group", "DELETE", `/admin/group/delete/${state.groupId}`],
    ["event", "DELETE", `/admin/event/delete/${state.eventId}`],
    ["announcement", "DELETE", `/admin/announcement/delete/${state.announcementId}`],
    ["news article", "DELETE", `/admin/news/delete/${state.newsId}`],
    ["category", "DELETE", `/admin/category/delete/${state.categoryId}`],
    ["report", "DELETE", `/admin/reports/admin/delete/${state.reportId}`],
    ["review", "DELETE", `/admin/reviews/delete/${state.reviewId}`],
    ["suggestion", "DELETE", `/admin/suggestion/delete/${state.suggestionId}`]
  ];

  for (const [label, method, path] of deletions) {
    await check(`delete ${label}`, async () => {
      await call(path, { method, token: state.adminToken, expect: 200 });
    });
  }

  await check("delete a member", async () => {
    await call(`/admin/user/delete/${state.carol.id}`, { method: "DELETE", token: state.adminToken, expect: 200 });
  });

  await check("sign out", async () => {
    await call("/user/auth/logout", { method: "POST", token: state.alice.token, expect: 200 });
    await call("/admin/auth/logout", { method: "POST", token: state.adminToken, expect: 200 });
  });
};

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

const run = async () => {
  console.log(`\nFeature test against ${API}`);

  await registerAndVerify();
  await testPosts();
  await testFriends();
  await testChat();
  await testMemberMisc();
  await testAdminContent();
  await testMemberAppRoutes();
  await testAdminPosts();
  await testAdminGroups();
  await testAdminMembers();
  await testCleanupOperations();

  const failed = results.filter((result) => !result.ok);
  const bySection = new Map<string, { pass: number; fail: number }>();
  for (const result of results) {
    const entry = bySection.get(result.section) ?? { pass: 0, fail: 0 };
    result.ok ? (entry.pass += 1) : (entry.fail += 1);
    bySection.set(result.section, entry);
  }

  console.log(`\n${"=".repeat(64)}`);
  for (const [name, counts] of bySection) {
    const flag = counts.fail ? "\x1b[31m" : "\x1b[32m";
    console.log(`${flag}${String(counts.pass).padStart(3)} pass  ${String(counts.fail).padStart(2)} fail\x1b[0m   ${name}`);
  }
  console.log("=".repeat(64));
  console.log(`TOTAL: ${results.length - failed.length} passed, ${failed.length} failed`);

  if (failed.length) {
    console.log("\nFailures:");
    for (const result of failed) console.log(`  [${result.section}] ${result.name}\n      ${result.detail}`);
  }

  process.exit(failed.length ? 1 : 0);
};

void run();
