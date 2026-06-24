FROM node:20-alpine AS base
WORKDIR /app

# System deps: openssl for Prisma, python for data processing
RUN apk add --no-cache openssl python3 py3-pip gcc g++ musl-dev python3-dev && \
    ln -sf python3 /usr/bin/python

# Install Python deps
COPY python/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt

# Node deps
COPY backend/package*.json ./
RUN npm install --production=false

# Prisma
COPY backend/prisma ./prisma
RUN npx prisma generate

# App source
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Python scripts
COPY python /app/python

RUN npm run build

EXPOSE 4000
CMD ["node", "dist/index.js"]
