# Garson MVP (PWA) - Monorepo

Bu repo, tek kurucu için hızlı demo çıkarmaya yönelik **Guest PWA + Admin + Kitchen (KDS-lite)** ve **Backend API** içerir.

## Modüller
- Guest: `/t/{qr_token}` (masaya giriş, koltuk seçimi, menü, sepet, sipariş)
- Admin: `/admin` (placeholder)
- Kitchen (KDS-lite): `/kitchen` (sipariş listesi, durum güncelleme)

## Stack
- Frontend: Next.js + TypeScript + Tailwind
- Backend: Node.js + TypeScript + Fastify + Prisma
- DB: PostgreSQL (Docker compose ile)

> Ödeme / PSP entegrasyonu şimdilik stub. Webhook ve idempotency iskeleti hazır.

## Hızlı Başlangıç

### 1) Gereksinimler
- Node.js 20+ (LTS)
- pnpm (`npm i -g pnpm`)
- Docker Desktop (Postgres için)

### 2) Ortam Değişkenleri
Kopyala:
- `apps/api/.env.example` -> `apps/api/.env`
- `apps/web/.env.example` -> `apps/web/.env.local`

### 3) DB'yi kaldır
```bash
docker compose up -d
```

### 4) Bağımlılıkları kur
```bash
pnpm install
```

### 5) Prisma migrate + seed
```bash
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

### 6) Dev çalıştır
```bash
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

Demo:
- Guest: http://localhost:3000/t/demo
- Kitchen: http://localhost:3000/kitchen

## Domain (garson.com.tr) Yayına Alma (özet)
- Web’i Vercel’e deploy et (apps/web)
- API’yi Render/Railway/Fly’a deploy et (apps/api)
- `www.garson.com.tr` için DNS:
  - Vercel: CNAME `www` -> `cname.vercel-dns.com` (Vercel’in verdiği yönergeye göre)
  - API için: `api` subdomain (ör. `api.garson.com.tr`) CNAME -> backend host

## Lisans
MIT
