import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeVideoFrame = async (sport: string, base64Image: string, detectionsContext?: string) => {
  const response = await ai.models.generateContent({
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
            { "playerId": "P1", "movement": 8.5, "speed": 7.2, "participation": 9.1, "stability": 6.5, "suggestedRole": "Striker" },
            ...
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
  return JSON.parse(response.text);
};

export const analyzeStrategy = async (sport: string, formation: string, context: string) => {
  const response = await ai.models.generateContent({
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
  return JSON.parse(response.text);
};

export const chatWithAI = async (message: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the AI Sports Strategy Analyzer (AI-SSA) assistant. 
    Help the user with app features, sports strategy, or performance analytics.
    User: ${message}`,
  });
  return response.text;
};
