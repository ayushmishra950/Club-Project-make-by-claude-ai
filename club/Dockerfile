# Multi-stage build: the front ends are compiled in the first stage and only
# their output is copied forward, so node_modules for three projects never
# reaches the runtime image.

FROM node:20-alpine AS build
WORKDIR /app

# Dependencies first, so a source change does not invalidate the install layer.
COPY backend/package*.json ./backend/
COPY admin/package*.json ./admin/
COPY user/connect-share/package*.json ./user/connect-share/

RUN npm --prefix backend ci --no-audit --no-fund \
 && npm --prefix admin ci --no-audit --no-fund \
 && npm --prefix user/connect-share ci --no-audit --no-fund

COPY . .

RUN npm --prefix admin run build \
 && npm --prefix user/connect-share run build \
 && npm --prefix backend run build \
 && cp -R admin/dist backend/dist/admin_build \
 && cp -R user/connect-share/dist backend/dist/user_build


FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Production dependencies only.
COPY backend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

COPY --from=build /app/backend/dist ./dist

# Run as a non-root user.
RUN addgroup -S club && adduser -S club -G club && chown -R club:club /app
USER club

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/app.js"]
