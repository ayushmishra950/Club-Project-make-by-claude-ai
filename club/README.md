# Jain Social Group

A club platform: a public site, a member community app, and an admin dashboard,
served by one Node API.

```
club/
  backend/              Express 5 + MongoDB API, and the server that hosts both SPAs
  admin/                Admin dashboard (React + Vite), served at /admin
  user/connect-share/   Member app (React + Vite), served at /
  scripts/build-all.sh  Builds both front ends and publishes them into the API
```

## Running it locally

You need Node 20 or newer and a MongoDB connection string.

```bash
cp backend/.env.example backend/.env
cp admin/.env.example admin/.env
cp user/connect-share/.env.example user/connect-share/.env
```

Fill in `backend/.env`. The two token secrets are required and the server
refuses to start without them, which is deliberate: it used to fall back to a
hardcoded string when they were missing.

```bash
openssl rand -hex 32   # run twice, for ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET
```

Then install and start each part:

```bash
npm --prefix backend install && npm --prefix backend run dev              # :5000
npm --prefix admin install && npm --prefix admin run dev                 # :8080
npm --prefix user/connect-share install && npm --prefix user/connect-share run dev
```

### The first admin account

Admin registration is not a public endpoint. Create the first account from the
server, then invite the rest from inside the dashboard:

```bash
npm --prefix backend run create-admin
```

### Indexes

Mongoose builds indexes lazily, which is wrong in production. Run this once per
deploy after the models change:

```bash
npm --prefix backend run sync-indexes
```

## Building for production

```bash
./scripts/build-all.sh
npm --prefix backend start
```

The script type-checks everything, builds both SPAs, compiles the API, and
copies the front-end output to where the server expects it. Doing that copy by
hand is how a stale bundle reaches production, so it is part of the script.

## Deploying

One service serves everything: the API and both front ends from the same
origin. `render.yaml` describes it. The build command is what matters:

```bash
npm ci && npm run build:full
```

`build:full` compiles the API and then builds both front ends into
`backend/dist`. They are built **on the host**, from source. Build output is
git-ignored, so a copy made locally never reaches the deployment, and the site
comes up as API-only if the host does not build them itself.

The front-end install prefers `npm ci` and falls back to `npm install` if the
host's npm rejects the lock file. Different npm versions record peer
dependencies differently, so a lock written locally can be refused on the build
host; failing the whole deploy over that is not worth it. Playwright's browser
download is skipped, since the build runs no tests.

Because the front ends are served from the same origin as the API, they need no
`VITE_BACKEND_URL`: it defaults to `/api`. Set it only when the API lives on a
different origin.

Two variables are worth checking after the first deploy:

- `FRONTEND_USER_PRODUCTION_URL` and `FRONTEND_ADMIN_PRODUCTION_URL` should be
  the service's own public URL. They control which origins may open a socket.
- `RESET_URL` is where a password-reset link points.

With Docker:

```bash
docker build -t club .
docker run -p 5000:5000 --env-file backend/.env club
```

## How the API is organised

Authentication is mounted per router in `backend/app.ts`, so an endpoint added
inside any of these files is protected by default.

| Prefix | Who can reach it |
| --- | --- |
| `/api/public/*` | Anybody. Read-only content for the marketing pages. |
| `/api/user/auth/*` | Registration, sign-in, refresh and the social callbacks are open; the rest need a session. |
| `/api/user/password/*` | Open, rate limited per account and per address. |
| `/api/user/*` | Any signed-in account. |
| `/api/admin/auth/login` | Open. |
| `/api/admin/*` | Signed-in admin accounts only. |
| `/healthz` | Anybody. Liveness only, no data. |

Three rules hold throughout the API code:

- **The caller is `req.actor`**, set by `requireAuth` from a verified token.
  A `userId` in the body or the URL is only ever the *target* of an action.
  `bindActor` overwrites identity fields on the request with the verified
  caller, so a handler that reads `req.body.userId` cannot be pointed at
  somebody else's account.
- **Responses go through `utils/serialize.ts`.** Mongoose documents are never
  returned directly. `publicUser` is what one member may see of another;
  `selfUser` is a member's own record; `safeAdmin` is an admin account.
- **Writes use an allow-list.** `EDITABLE_PROFILE_FIELDS` is what a member may
  change about themselves. Role, verification and premium status are admin
  decisions and live on admin endpoints.

## Environment variables

`backend/config/env.ts` validates the whole environment at boot and exits with
a readable list if anything is missing. `backend/.env.example` documents every
variable. Optional integrations (Twilio, Resend, Google, Apple) can be left
blank and that feature turns itself off.

## Things worth knowing

- **Front-end routing is `BrowserRouter`.** Deep links work because the API
  server serves `index.html` for unmatched paths.
- **The member feed and directory are paged.** Both return a cursor; pass it
  back for the next page.
- **Presence and rate limiting are per process.** Before running more than one
  instance, move both to Redis (`@socket.io/redis-adapter` and
  `rate-limit-redis`). Nothing else needs to change.
- **Six admin pages are not in the router**: Referrals, Tasks, Finance,
  Payments, Attendance and Polls render from a local dummy-data file and have
  no backend. They are kept out of the navigation until they are built, rather
  than looking like working features.
