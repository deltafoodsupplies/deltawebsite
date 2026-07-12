import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./config.js";
import { inquiriesRouter } from "./routes/inquiries.js";

const app = express();
app.set("trust proxy", 1); // Cloud Run sits behind a proxy

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin/server-to-server requests (no Origin header) and allowlisted sites.
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

// Health check (Cloud Run liveness + your uptime monitor)
app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    db: config.skipDb ? "skipped" : mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: Math.round(process.uptime()),
  });
});

app.use("/api/inquiries", inquiriesRouter);

// 404 + error handling
app.use((req, res) => res.status(404).json({ ok: false, error: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ ok: false, error: "Origin not allowed" });
  }
  console.error("[error]", err);
  res.status(500).json({ ok: false, error: "Internal server error" });
});

async function start() {
  if (!config.skipDb) {
    if (!config.mongoUri) {
      console.error("MONGODB_URI is required (or set SKIP_DB=1 for local testing).");
      process.exit(1);
    }
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log("[db] connected");
  } else {
    console.warn("[db] SKIP_DB=1 — running without a database");
  }
  app.listen(config.port, () => console.log(`[server] listening on :${config.port}`));
}

start().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
