# KKU Security Score Card

Full-stack monorepo: Next.js frontend, Express + Prisma backend, Python processor.

- `frontend/` — Next.js app
- `backend/` — Express API + Prisma (PostgreSQL)
- `python/` — CSV processing scripts
- `nginx/` — reverse proxy for the dockerized deployment

See [DEV_MODE.md](DEV_MODE.md), [ASSET_SYSTEM.md](ASSET_SYSTEM.md), and [SYSTEM_ANALYSIS.md](SYSTEM_ANALYSIS.md) for details.

## Environment setup

Copy `backend/.env.example` to `backend/.env` and fill in the values.

### ENCRYPTION_KEY (required)

Sensitive settings (e.g. the SecurityScorecard API key) are stored AES-256-GCM
encrypted at rest. The backend **refuses to start** without a valid
`ENCRYPTION_KEY` — a 32-byte value encoded as 64 hex characters.

Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the result in `backend/.env`:

```
ENCRYPTION_KEY=<64-hex-char string>
```

For the dockerized deployment, set the same value under the `backend` service's
`environment:` block in `docker-compose.yml`.

> ⚠️ Changing `ENCRYPTION_KEY` after secrets have been saved makes existing
> encrypted values undecryptable — they fall back to env vars and must be re-saved.

## Database migrations

```bash
cd backend
npx prisma migrate deploy   # apply existing migrations
npx prisma generate         # regenerate the Prisma client
```
