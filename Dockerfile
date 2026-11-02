FROM oven/bun:1.1.42-alpine AS builder

RUN apk add --no-cache git openssh

WORKDIR /app

RUN git config --global url."https://".insteadOf git://

COPY package*.json ./

RUN bun install

COPY . .

FROM oven/bun:1.1.42-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY --from=builder /app .

CMD ["bun", "index.js"]