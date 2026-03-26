import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Trophy, Activity, Zap, Shield } from "lucide-react";

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
      className="flex flex-col gap-2"
    >
      <span className="text-3xl font-bold">{value}</span>
      <span className="text-sm text-gray-500 uppercase tracking-widest">{label}</span>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="grid lg:grid-template-columns-[1.2fr_0.8fr] gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, x: -50 },
              visible: { 
                opacity: 1, 
                x: 0,
                transition: { 
                  duration: 0.8,
                  staggerChildren: 0.2,
                  delayChildren: 0.3
                }
              }
            }}
          >
            <motion.h1 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-6"
            >
              AI SPORTS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400">
                STRATEGY
              </span> <br />
              ANALYZER
            </motion.h1>
            <motion.p 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="text-xl text-gray-400 max-w-xl mb-10"
            >
              Unlock professional-grade sports intelligence. Detect formations, predict strategies, and dominate the game with real-time AI computer vision.
            </motion.p>
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="flex gap-4"
            >
              <Link
                to="/auth"
                className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(234,88,12,0.4)]"
              >
                GET STARTED
              </Link>
              <button className="px-8 py-4 border border-white/10 hover:bg-white/5 text-white font-bold rounded-xl transition-all">
                WATCH DEMO
              </button>
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className="grid grid-cols-3 gap-8 mt-20"
            >
              <StatItem value="94%" label="Accuracy" />
              <StatItem value="20+" label="Sports" />
              <StatItem value="Real-time" label="Analysis" />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <span className="text-sm font-mono text-orange-500 uppercase tracking-widest">Live Analysis</span>
                </div>
                <Trophy className="text-yellow-500 w-6 h-6" />
              </div>
              
              <div className="aspect-video bg-black/40 rounded-xl mb-6 relative overflow-hidden group">
                <img 
                  src="https://picsum.photos/seed/football/800/450" 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 border-2 border-orange-500/30 pointer-events-none" />
                {/* Simulated Bounding Boxes */}
                <div className="absolute top-1/4 left-1/3 w-12 h-20 border-2 border-green-500 rounded shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <div className="absolute top-1/2 left-1/2 w-12 h-20 border-2 border-blue-500 rounded shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-gray-400">Formation</span>
                  <span className="font-bold text-orange-500">4-3-3 ATTACK</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-gray-400">Strategy</span>
                  <span className="font-bold text-blue-400">HIGH PRESS</span>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-10 -right-10 p-4 bg-orange-600 rounded-2xl shadow-xl"
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div 
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-10 -left-10 p-4 bg-blue-600 rounded-2xl shadow-xl"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
