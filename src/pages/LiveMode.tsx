import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Zap, Shield, Target, Activity, Maximize, Settings, Monitor, Trophy, Loader2, X, Check, Users } from "lucide-react";
import { analyzeVideoFrame } from "../lib/gemini";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";

const AVAILABLE_OBJECTS = [
  "person", "sports ball", "baseball bat", "baseball glove", "skateboard", 
  "surfboard", "tennis racket", "frisbee", "skis", "snowboard", "bottle", "chair"
];

export default function LiveMode() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'webcam' | 'screen' | null>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState({
    confidenceThreshold: 0.5,
    analysisInterval: 8000,
    trackedObjects: ["person", "sports ball", "baseball bat", "tennis racket"]
  });

  const [stats, setStats] = useState({
    detectedSport: "Detecting...",
    formation: "Detecting...",
    strategy: "Analyzing...",
    liveGameplan: "Calculating...",
    score: "0-0",
    playerPerformanceScore: 0,
    comparisonData: [] as any[]
  });

  const [logs, setLogs] = useState<any[]>([
    { time: "14:32:01", text: "System initialized", color: "text-green-500" },
  ]);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        setIsModelLoading(false);
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), text: "CNN Model Loaded (COCO-SSD)", color: "text-blue-400" }, ...prev]);
      } catch (e) {
        console.error("Failed to load CNN model:", e);
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, []);

  const startLive = async (type: 'webcam' | 'screen') => {
    try {
      const stream = type === 'webcam' 
        ? await navigator.mediaDevices.getUserMedia({ video: true })
        : await navigator.mediaDevices.getDisplayMedia({ video: true });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setMode(type);
        setIsActive(true);
        
        // Handle stream end (especially for screen share)
        stream.getVideoTracks()[0].onended = () => {
          stopLive();
        };
      }
    } catch (e: any) {
      console.error("Access denied", e);
      if (e.name === 'NotAllowedError' && type === 'screen') {
        alert("Screen sharing is blocked by the browser's permission policy in this preview window. Please open the application in a new tab to use the Screen Detector feature.");
      } else {
        alert(`${type === 'webcam' ? 'Camera' : 'Screen'} access denied or cancelled.`);
      }
    }
  };

  const stopLive = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setMode(null);
  };

  useEffect(() => {
    if (!isActive) return;

    let isAnalyzing = false;
    let currentDetections: cocoSsd.DetectedObject[] = [];

    // Fast loop for CNN Visuals (Bounding Boxes)
    const visualInterval = setInterval(async () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video || !model) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Run detection
      const predictions = await model.detect(video);
      // Include more relevant classes for sports based on settings
      const relevantObjects = predictions.filter(p => 
        settings.trackedObjects.includes(p.class) && p.score >= settings.confidenceThreshold
      );
      currentDetections = relevantObjects;

      // Draw visuals
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      relevantObjects.forEach((p) => {
        const [x, y, width, height] = p.bbox;
        
        // Dynamic colors based on class
        let color = "#f97316"; // Default orange
        if (p.class === "sports ball") color = "#3b82f6"; // Blue
        if (p.class === "person") color = "#10b981"; // Green
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        
        // Draw corners only for a "high-tech" look
        const len = 20;
        ctx.beginPath();
        // Top Left
        ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
        // Top Right
        ctx.moveTo(x + width - len, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + len);
        // Bottom Right
        ctx.moveTo(x + width, y + height - len); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width - len, y + height);
        // Bottom Left
        ctx.moveTo(x + len, y + height); ctx.lineTo(x, y + height); ctx.lineTo(x, y + height - len);
        ctx.stroke();

        // Semi-transparent fill
        ctx.fillStyle = `${color}22`;
        ctx.fillRect(x, y, width, height);
        
        // Label with score
        ctx.fillStyle = color;
        ctx.font = "bold 12px JetBrains Mono";
        ctx.fillText(`${p.class.toUpperCase()} ${Math.round(p.score * 100)}%`, x, y - 8);
      });
    }, 100);

    // Slower loop for Gemini Strategy Analysis
    const analysisInterval = setInterval(async () => {
      if (isAnalyzing) return;
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      isAnalyzing = true;
      try {
        // Capture a clean frame (without our drawings)
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = canvas.width;
        offscreenCanvas.height = canvas.height;
        const offCtx = offscreenCanvas.getContext("2d");
        if (offCtx) {
          offCtx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
          const base64Image = offscreenCanvas.toDataURL("image/jpeg", 0.6).split(",")[1];
          
          const detectionsContext = currentDetections
            .map(d => `${d.class} at [${d.bbox.map(Math.round).join(",")}]`)
            .join("; ");

          const analysis = await analyzeVideoFrame("general", base64Image, detectionsContext);
          
          setStats({
            detectedSport: analysis.detectedSport || "Unknown",
            formation: analysis.formation || "N/A",
            strategy: analysis.strategy || "N/A",
            liveGameplan: analysis.liveGameplan || "N/A",
            score: analysis.score || stats.score,
            playerPerformanceScore: analysis.playerPerformanceScore || 0,
            comparisonData: analysis.comparisonData || []
          });

          setLogs(prev => [
            { 
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
              text: `[AI Update] ${analysis.detectedSport} | Score: ${analysis.score}`,
              color: "text-orange-400"
            },
            ...prev.slice(0, 5)
          ]);
        }
      } catch (e: any) {
        console.error("Live AI Analysis failed", e);
        setLogs(prev => [
          { 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
            text: `[AI Error] ${e.message || "Analysis failed"}`,
            color: "text-red-500"
          },
          ...prev.slice(0, 5)
        ]);
      } finally {
        isAnalyzing = false;
      }
    }, settings.analysisInterval);

    return () => {
      clearInterval(visualInterval);
      clearInterval(analysisInterval);
    };
  }, [isActive, stats.score, model, settings]);

  const toggleTrackedObject = (obj: string) => {
    setSettings(prev => ({
      ...prev,
      trackedObjects: prev.trackedObjects.includes(obj)
        ? prev.trackedObjects.filter(o => o !== obj)
        : [...prev.trackedObjects, obj]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Live AI Tracking</h2>
          <p className="text-gray-500">Real-time computer vision analysis via webcam/screen.</p>
        </div>
        <div className="flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Settings className="w-6 h-6" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Maximize className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          {!isActive ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-orange-600/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Monitor className="w-12 h-12 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Screen Live Detector</h3>
              <p className="text-gray-500 max-w-md mb-8">
                Connect your camera or share your screen to start real-time sport detection, score tracking, and live gameplan analysis.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => startLive('webcam')}
                  disabled={isModelLoading}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isModelLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                  WEBCAM MODE
                </button>
                <button
                  onClick={() => startLive('screen')}
                  disabled={isModelLoading}
                  className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-600/40 flex items-center gap-2 disabled:opacity-50"
                >
                  {isModelLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Monitor className="w-5 h-5" />}
                  SCREEN DETECTOR
                </button>
              </div>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover opacity-60"
              />
              <canvas 
                ref={canvasRef} 
                width={1280} 
                height={720} 
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 bg-red-600 rounded-full"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {mode === 'screen' ? 'Screen Detection Active' : 'Live Camera Active'}
                </span>
              </motion.div>
              <button 
                onClick={stopLive}
                className="absolute bottom-6 right-6 px-4 py-2 bg-white/10 hover:bg-red-600/20 text-white text-xs font-bold rounded-lg border border-white/10 transition-colors"
              >
                STOP SESSION
              </button>
            </>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="space-y-4"
          >
            <LiveStatCard 
              label="Detected Sport" 
              value={stats.detectedSport} 
              icon={<Trophy className="text-yellow-500" />} 
            />
            <LiveStatCard 
              label="Live Score" 
              value={stats.score} 
              icon={<Target className="text-red-500" />} 
            />
            <LiveStatCard 
              label="Formation" 
              value={stats.formation} 
              icon={<Shield className="text-blue-500" />} 
            />
            <LiveStatCard 
              label="Live Gameplan" 
              value={stats.liveGameplan} 
              icon={<Zap className="text-orange-500" />} 
            />
            <LiveStatCard 
              label="Team Performance" 
              value={`${stats.playerPerformanceScore}%`} 
              icon={<Activity className="text-green-500" />} 
            />
          </motion.div>

          {stats.comparisonData.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 p-6 rounded-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-orange-500" />
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Player Comparison</h4>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.comparisonData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="attribute" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Player A"
                      dataKey="Player A"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.6}
                      animationBegin={0}
                      animationDuration={1500}
                    />
                    <Radar
                      name="Player B"
                      dataKey="Player B"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      animationBegin={500}
                      animationDuration={1500}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/10 p-6 rounded-2xl"
          >
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Live Activity Log</h4>
            <div className="space-y-3 font-mono text-[10px]">
              {logs.map((log, i) => (
                <LogEntry key={i} time={log.time} text={log.text} color={log.color} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#151619] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-bottom border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold uppercase tracking-tight">Detection Settings</h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Confidence Threshold */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Confidence Threshold</label>
                    <span className="text-orange-500 font-mono text-sm">{Math.round(settings.confidenceThreshold * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="0.9" 
                    step="0.05"
                    value={settings.confidenceThreshold}
                    onChange={(e) => setSettings(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                  <p className="text-[10px] text-gray-600">Lower values detect more objects but with less accuracy.</p>
                </div>

                {/* Analysis Interval */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">AI Analysis Interval</label>
                    <span className="text-orange-500 font-mono text-sm">{settings.analysisInterval / 1000}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="3000" 
                    max="30000" 
                    step="1000"
                    value={settings.analysisInterval}
                    onChange={(e) => setSettings(prev => ({ ...prev, analysisInterval: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                  <p className="text-[10px] text-gray-600">Frequency of deep tactical analysis by Gemini AI.</p>
                </div>

                {/* Tracked Objects */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tracked Object Classes</label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABLE_OBJECTS.map(obj => (
                      <button
                        key={obj}
                        onClick={() => toggleTrackedObject(obj)}
                        className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-between ${
                          settings.trackedObjects.includes(obj) 
                            ? "bg-orange-600 text-white" 
                            : "bg-white/5 text-gray-500 hover:bg-white/10"
                        }`}
                      >
                        {obj.replace("sports ball", "ball")}
                        {settings.trackedObjects.includes(obj) && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 flex justify-end">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  SAVE & CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LiveStatCard({ label, value, icon }: any) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 }
      }}
      whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center gap-4 transition-colors cursor-default"
    >
      <motion.div 
        whileHover={{ rotate: [0, -10, 10, 0] }}
        className="p-3 bg-white/5 rounded-xl"
      >
        {icon}
      </motion.div>
      <div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">{label}</span>
        <AnimatePresence mode="wait">
          <motion.span 
            key={value}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xl font-bold block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function LogEntry({ time, text, color }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex gap-2 ${color}`}
    >
      <span>[{time}]</span>
      <span>{text}</span>
    </motion.div>
  );
}
