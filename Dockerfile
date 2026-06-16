FROM node:20-slim AS base

# better-sqlite3 빌드에 필요한 네이티브 의존성
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 설치
COPY package.json package-lock.json ./
RUN npm ci

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# standalone 결과물에 public, static 복사
RUN cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/

# data 디렉토리 (Volume 마운트 대상)
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", ".next/standalone/server.js"]
