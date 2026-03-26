import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import fs from "fs";

const app = express();
const PORT = 3000;

// Database Setup
const db = new Database("database.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    sport_type TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    video_id INTEGER,
    formation TEXT,
    strategy TEXT,
    counter_strategy TEXT,
    confidence REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS player_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER,
    player_id TEXT,
    movement REAL,
    speed REAL,
    participation REAL,
    stability REAL,
    suggested_role TEXT
  );
`);

app.use(express.json());

// API Routes
app.get("/api/history/:userId", (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, v.sport_type 
    FROM reports r 
    JOIN videos v ON r.video_id = v.id 
    WHERE r.user_id = ? 
    ORDER BY r.created_at DESC
  `).all(req.params.userId);
  res.json(reports);
});

app.post("/api/save-report", (req, res) => {
  const { userId, sportType, formation, strategy, counterStrategy, confidence, playerStats } = req.body;
  
  const videoInfo = db.prepare("INSERT INTO videos (user_id, sport_type, file_path) VALUES (?, ?, ?)").run(userId, sportType, "simulated_path");
  const videoId = videoInfo.lastInsertRowid;
  
  const reportInfo = db.prepare(`
    INSERT INTO reports (user_id, video_id, formation, strategy, counter_strategy, confidence) 
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, videoId, formation, strategy, counterStrategy, confidence);
  const reportId = reportInfo.lastInsertRowid;

  const insertStat = db.prepare(`
    INSERT INTO player_stats (report_id, player_id, movement, speed, participation, stability, suggested_role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const stat of playerStats) {
    insertStat.run(reportId, stat.playerId, stat.movement, stat.speed, stat.participation, stat.stability, stat.suggestedRole);
  }

  res.json({ success: true, reportId });
});

app.get("/api/report/:reportId", (req, res) => {
  const report = db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.reportId);
  const stats = db.prepare("SELECT * FROM player_stats WHERE report_id = ?").all(req.params.reportId);
  res.json({ ...report, playerStats: stats });
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
