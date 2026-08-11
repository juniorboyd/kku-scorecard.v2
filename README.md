# KKU Security Score Card

Full-stack monorepo: Next.js frontend, Express + Prisma backend, Python processor.

- `frontend/` — Next.js app
- `backend/` — Express API + Prisma (PostgreSQL)
- `python/` — CSV processing scripts
- `nginx/` — reverse proxy for the dockerized deployment

See [DEV_MODE.md](DEV_MODE.md), [ASSET_SYSTEM.md](ASSET_SYSTEM.md), and [SYSTEM_ANALYSIS.md](SYSTEM_ANALYSIS.md) for details.

---

## 🚀 Quick Start (Dockerized Deployment)

To build and start the entire stack (PostgreSQL, Backend, Frontend, and Nginx proxy) in development/production mode:

```bash
# Start all containers in background
docker compose up --build -d

# Stop all containers
docker compose down
```

The application will be accessible securely at **`https://localhost:4333`** (proxied by Nginx).

---

## ⚙️ Environment Setup

Copy `backend/.env.example` to `backend/.env` and fill in the values.

### 🔑 ENCRYPTION_KEY (required)

Sensitive settings (e.g. the SecurityScorecard API key) are stored AES-256-GCM encrypted at rest. The backend **refuses to start** without a valid `ENCRYPTION_KEY` — a 32-byte value encoded as 64 hex characters.

Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put the result in `backend/.env` and in `docker-compose.yml` under the `backend` environment block:

```env
ENCRYPTION_KEY=<64-hex-char string>
```

---

## 🔌 LibreNMS & Network Map Integration

The dashboard features an interactive **SVG Network Topology Map** (`/network-map`) that polls live device metadata from the university's LibreNMS instance.

### 1. Configuration (`backend/.env`)

Ensure the following variables are configured with your live LibreNMS endpoint and token:

```env
LIBRENMS_API_URL=https://lnms.kku.ac.th/api/v0
LIBRENMS_API_TOKEN=<YOUR_LIBRENMS_API_TOKEN>
```

### 2. Device to Organization Mapping

Since LibreNMS devices typically report IP addresses as their hostnames, the system uses a **token-based matching algorithm** on both `hostname` and `sysName` (device system name) to automatically classify network switches under their respective KKU faculties/departments (e.g. `faculty-vet-b3` -> คณะสัตวแพทยศาสตร์, `kkbs-bs01` -> คณะบริหารธุรกิจและการบัญชี).

If no keywords match, the device falls under "ไม่ระบุสังกัด (Unassigned)" directly connected to the Core Router.

---

## 🗄️ Database Migrations (Local Development)

If running outside Docker:

```bash
cd backend
npx prisma migrate deploy   # apply existing migrations
npx prisma generate         # regenerate the Prisma client
```

---

## 🛡️ Two-Factor Authentication (2FA)

The system enforces a secure, industry-standard **TOTP (Time-based One-Time Password)** multi-factor authentication mechanism for all authenticated routes.

### 1. User Interface
- Users can manage (enable/disable) their 2FA settings directly under **"การตั้งค่าบัญชี" (Account Settings)** in the top-right profile dropdown menu.
- During registration, a secure QR code is generated for scanning with mobile authenticator apps (e.g. Google Authenticator, Microsoft Authenticator, Authy).
- Once enabled, subsequent logins will prompt for a 6-digit verification code.

### 2. Cryptographic Security
- All 2FA secret keys are stored **AES-256-CBC encrypted** in the database to prevent compromises in case of a database leak.
- Verification uses standard `otplib` checks configured to align strictly with standard 30-second cycles.

### 🛠️ CLI Admin Utility

An administrator command-line tool is available inside the backend container to troubleshoot and manage user 2FA statuses directly.

To access the utility, run:

```bash
# Reset (disable) 2FA for a user (useful if a user loses their authenticator app)
sudo docker compose exec backend node dist/check-user.js reset

# Scan for time-drift offsets (investigate why a code is rejected)
sudo docker compose exec backend node dist/check-user.js scan <6-digit-otp-code-from-user>
```
