import express from "express";
import session from "express-session";
import cors from "cors";
import fs from "fs";
import { PORT, FRONTEND_URL, SESSION_SECRET, DATA_DIR, UPLOAD_DIR, TEMP_DIR, AUTH_MODE, DEV_ROLE } from "./config.ts";
import { optionalAuth, DEV_USER } from "./middleware/auth.ts";
import routes from "./routes/index.ts";
import authRoutes from "./routes/auth.routes.ts";
import { scheduleDailyFetch } from "./cron.ts";
import prisma from "./lib/prisma.ts";

function ensureDirs() {
  [DATA_DIR, UPLOAD_DIR, TEMP_DIR].forEach((d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
}

async function ensureDevUser() {
  if (AUTH_MODE !== "DEV") return;
  const user = await prisma.user.upsert({
    where: { email: DEV_USER.email },
    update: { status: "ACTIVE", role: DEV_ROLE },
    create: {
      email: DEV_USER.email,
      firstName: DEV_USER.firstName,
      lastName: DEV_USER.lastName,
      role: DEV_ROLE,
      status: "ACTIVE",
      facultyName: DEV_USER.facultyName,
    },
  });
  DEV_USER.id = user.id;
  console.log(`[DEV] User seeded: id=${user.id} (${user.email})`);
}

const app = express();

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(optionalAuth);
import publicRoutes from "./routes/public.routes.ts";

app.use("/auth", authRoutes);
app.use("/api/public/v1", publicRoutes);
app.use("/api", routes);

app.get("/health", (_req, res) => res.json({ status: "ok", authMode: AUTH_MODE }));
app.get("/", (_req, res) => res.json({ message: "KKU SecurityScorecard Backend", authMode: AUTH_MODE }));

ensureDirs();
ensureDevUser()
  .then(() => {
    scheduleDailyFetch();
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT} [AUTH_MODE=${AUTH_MODE}]`);
    });
  })
  .catch((err) => {
    console.error("Startup failed:", err);
    process.exit(1);
  });
