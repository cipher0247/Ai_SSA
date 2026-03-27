import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

// Firebase Admin Setup
admin.initializeApp({
  projectId: "gen-lang-client-0852621378"
});
const databaseId = "ai-studio-395673ba-245d-4d69-8f76-28e53dc1e116";
const db = getFirestore(databaseId);

// Gemini Setup
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set. AI features will not work.");
}
// Initialize with the key if it exists, otherwise we'll handle it in the routes
const genAI = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

app.use(express.json());

// Helper to check AI availability
const checkAI = (res: express.Response) => {
  if (!genAI) {
    res.status(503).json({ 
      error: "AI Service Unavailable", 
      message: "The Gemini API key is missing. Please set GEMINI_API_KEY in your environment variables." 
    });
    return false;
  }
  return true;
};

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    geminiKeySet: !!GEMINI_KEY,
    geminiKeyLength: GEMINI_KEY ? GEMINI_KEY.length : 0,
    firebaseProjectId: admin.app().options.projectId
  });
});

app.get("/api/history/:userId", async (req, res) => {
  try {
    const reportsSnapshot = await db.collection("reports")
      .where("user_id", "==", req.params.userId)
      .orderBy("created_at", "desc")
      .get();
    
    const reports = reportsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at
      };
    });
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/save-report", async (req, res) => {
  try {
    const { userId, sportType, formation, strategy, counterStrategy, confidence, playerStats } = req.body;
    
    const videoRef = await db.collection("videos").add({
      user_id: userId,
      sport_type: sportType,
      file_path: "simulated_path",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const reportRef = await db.collection("reports").add({
      user_id: userId,
      video_id: videoRef.id,
      sport_type: sportType, // Added for easier querying
      formation,
      strategy,
      counter_strategy: counterStrategy,
      confidence,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    const statsBatch = db.batch();
    for (const stat of playerStats) {
      const statRef = db.collection("player_stats").doc();
      statsBatch.set(statRef, {
        report_id: reportRef.id,
        ...stat
      });
    }
    await statsBatch.commit();

    res.json({ success: true, reportId: reportRef.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/report/:reportId", async (req, res) => {
  try {
    const reportDoc = await db.collection("reports").doc(req.params.reportId).get();
    if (!reportDoc.exists) {
      return res.status(404).json({ error: "Report not found" });
    }
    
    const data = reportDoc.data();
    const statsSnapshot = await db.collection("player_stats")
      .where("report_id", "==", req.params.reportId)
      .get();
    
    const stats = statsSnapshot.docs.map(doc => doc.data());
    res.json({ 
      ...data, 
      id: reportDoc.id, 
      playerStats: stats,
      created_at: data?.created_at?.toDate?.()?.toISOString() || data?.created_at
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Endpoints
app.post("/api/ai/analyze-frame", async (req, res) => {
  if (!checkAI(res)) return;
  try {
    const { sport, base64Image, detectionsContext } = req.body;
    const response = await genAI!.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `Analyze this live sports frame. 
          ${detectionsContext ? `Context from CNN Detection: ${detectionsContext}` : ""}
          1. Detect the sport being played (if not ${sport}, identify it).
          2. Detect the current formation or tactical layout.
          3. Analyze the active strategy and predict the immediate LIVE GAMEPLAN (next tactical moves).
          4. Detect or predict the current SCORE based on the visual context (scoreboard or game state).
          5. Provide a COUNTER STRATEGY to beat this setup.
          6. Provide a detailed WINNING PLAN for the team.
          7. Estimate confidence level (0.0 to 1.0).
          8. Provide simulated player stats for the top 3 active players.
          9. Provide a 'playerPerformanceScore' (0-100) for the overall team performance.
          10. Provide 'comparisonData' for a Player vs Player comparison graph (at least 2 players, 5 attributes each).
          
          Return the analysis in JSON format:
          {
            "detectedSport": "Sport Name",
            "formation": "Detected Formation",
            "strategy": "Strategy Description",
            "liveGameplan": "Immediate tactical advice/prediction",
            "counterStrategy": "How to counter this",
            "winningPlan": "Step-by-step winning strategy",
            "score": "Current Score (e.g. 2-1)",
            "confidence": 0.92,
            "playerPerformanceScore": 78,
            "comparisonData": [
              { "attribute": "Speed", "Player A": 85, "Player B": 70 },
              { "attribute": "Agility", "Player A": 90, "Player B": 80 },
              { "attribute": "Strength", "Player A": 75, "Player B": 85 },
              { "attribute": "Stamina", "Player A": 80, "Player B": 90 },
              { "attribute": "Accuracy", "Player A": 95, "Player B": 75 }
            ],
            "playerStats": [
              { "playerId": "P1", "movement": 8.5, "speed": 7.2, "participation": 9.1, "stability": 6.5, "suggestedRole": "Striker" }
            ]
          }`
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/analyze-strategy", async (req, res) => {
  if (!checkAI(res)) return;
  try {
    const { sport, formation, context } = req.body;
    const response = await genAI!.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following sports scenario:
      Sport: ${sport}
      Detected Formation: ${formation}
      Context: ${context}
      
      Provide a detailed strategy analysis in JSON format:
      {
        "strategy": "Offensive/Defensive description",
        "counterStrategy": "How to beat this formation",
        "confidence": 0.95,
        "playerTips": [
          "Tip for Player 1",
          "Tip for Player 2"
        ],
        "winningPlan": "Step by step plan to win"
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("AI Strategy Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/ai/chat", async (req, res) => {
  if (!checkAI(res)) return;
  try {
    const { message } = req.body;
    const response = await genAI!.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the AI Sports Strategy Analyzer (AI-SSA) assistant. 
      Help the user with app features, sports strategy, or performance analytics.
      User: ${message}`,
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vite Integration
export const app_instance = app;

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

  // Only listen if not on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
