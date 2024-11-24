FROM registry.access.redhat.com/ubi9/nodejs-20 AS base

# This value needs to be synced with the value in the .env file
# or exec --build-arg API_HOST= to override
ARG API_HOST=

FROM base AS builder
USER root
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build


FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
USER root
RUN groupadd --system --gid 1002 nodejs
RUN adduser --system --uid 1002 nextjs


# COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD HOSTNAME="0.0.0.0" node server.js
