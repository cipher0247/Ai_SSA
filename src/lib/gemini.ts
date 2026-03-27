export const analyzeVideoFrame = async (sport: string, base64Image: string, detectionsContext?: string) => {
  const response = await fetch("/api/ai/analyze-frame", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sport, base64Image, detectionsContext })
  });
  if (!response.ok) throw new Error("AI Analysis failed");
  return response.json();
};

export const analyzeStrategy = async (sport: string, formation: string, context: string) => {
  const response = await fetch("/api/ai/analyze-strategy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sport, formation, context })
  });
  if (!response.ok) throw new Error("AI Analysis failed");
  return response.json();
};

export const chatWithAI = async (message: string) => {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  if (!response.ok) throw new Error("AI Chat failed");
  const data = await response.json();
  return data.text;
};
