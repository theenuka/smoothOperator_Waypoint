// Waypoint API server.
import "./env.js"; // first: loads server/.env (Supabase keys) when it exists
import express from "express";
import cors from "cors";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { db, init } from "./db.js";
import { attach } from "./events.js";
import { requireAuth, socketAuth } from "./auth.js";

// Planning side: orders, planning, deferrals, notices, store issues
import orders from "./routes/orders.js";
import planning from "./routes/planning.js";
import deferrals from "./routes/deferrals.js";
import notices, { issues } from "./routes/notices.js";
// Execution side: runs, dock loads, deliveries, offline sync, tracking
import runs from "./routes/runs.js";
import loads from "./routes/loads.js";
import deliveries from "./routes/deliveries.js";
import sync from "./routes/sync.js";
import tracking from "./routes/tracking.js";
// Reference data and demo controls
import meta from "./routes/meta.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Sign-in check. Off until SUPABASE_URL is set (docs/AUTH.md).
app.use("/api", requireAuth());

app.get("/api/health", (req, res) => res.json({ ok: true, demoDate: db().meta.demoDate }));
app.use("/api/meta", meta);
app.use("/api/orders", orders);
app.use("/api/plan", planning);
app.use("/api/deferrals", deferrals);
app.use("/api/notices", notices);
app.use("/api/issues", issues);
app.use("/api/runs", runs);
app.use("/api/loads", loads);
app.use("/api/deliveries", deliveries);
app.use("/api/sync", sync);
app.use("/api/tracking", tracking);

// In production the server also serves the built web app (one deploy, one URL).
const here = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.join(here, "..", "..", "web", "dist");
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api|\/socket\.io).*/, (req, res) => res.sendFile(path.join(webDist, "index.html")));
}

// Errors: always JSON, never a crash.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
io.use(socketAuth());
attach(io);
io.on("connection", (socket) => socket.emit("hello", { at: new Date().toISOString() }));

// Load the data (Supabase or the JSON file) before taking requests.
await init();

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Waypoint API on http://localhost:${PORT}`));
