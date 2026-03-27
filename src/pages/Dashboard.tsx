import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Dribbble, 
  Target, 
  Users, 
  History, 
  TrendingUp, 
  ChevronRight,
  LayoutGrid,
  Globe,
  Activity,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";

const INDOOR_SPORTS = [
  { name: "Chess", icon: "♟️", color: "from-slate-700 to-slate-900" },
  { name: "Carrom", icon: "⚪", color: "from-amber-700 to-amber-900" },
  { name: "Table Tennis", icon: "🏓", color: "from-blue-700 to-blue-900" },
  { name: "Badminton", icon: "🏸", color: "from-green-700 to-green-900" },
];

const OUTDOOR_SPORTS = [
  { name: "Football", icon: "⚽", color: "from-emerald-700 to-emerald-900" },
  { name: "Cricket", icon: "🏏", color: "from-sky-700 to-sky-900" },
  { name: "Volleyball", icon: "🏐", color: "from-orange-700 to-orange-900" },
  { name: "Basketball", icon: "🏀", color: "from-red-700 to-red-900" },
];

export default function Dashboard({ user }: { user: { userId: string; username: string } }) {
  const [activeTab, setActiveTab] = useState<"indoor" | "outdoor">("outdoor");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, "reports"),
          where("userId", "==", user.userId),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const reports = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHistory(reports);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "reports");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user.userId]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-2"
        >
          Welcome back, <span className="text-orange-500">{user.username}</span>
        </motion.h2>
        <p className="text-gray-400">Select a sport category to begin your strategic analysis.</p>
      </header>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
        className="grid lg:grid-cols-4 gap-8 mb-16"
      >
        <StatCard title="Total Analysis" value="42" icon={<Activity className="text-orange-500" />} />
        <StatCard title="Win Rate" value="78%" icon={<Target className="text-green-500" />} />
        <StatCard title="Teams Tracked" value="12" icon={<Users className="text-blue-500" />} />
        <StatCard title="Active Sessions" value="3" icon={<TrendingUp className="text-purple-500" />} />
      </motion.div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("outdoor")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === "outdoor" 
              ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          <Globe className="w-5 h-5" />
          OUTDOOR SPORTS
        </button>
        <button
          onClick={() => setActiveTab("indoor")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === "indoor" 
              ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
              : "bg-white/5 text-gray-400 hover:bg-white/10"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          INDOOR SPORTS
        </button>
      </div>

      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {(activeTab === "outdoor" ? OUTDOOR_SPORTS : INDOOR_SPORTS).map((sport, idx) => (
            <motion.div
              key={sport.name}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: idx * 0.05 
              }}
            >
              <Link
                to={`/analysis/${sport.name.toLowerCase().replace(" ", "-")}`}
                className={`group relative block p-8 rounded-3xl bg-gradient-to-br ${sport.color} border border-white/10 overflow-hidden transition-all hover:scale-[1.05] hover:shadow-2xl hover:shadow-orange-500/20`}
              >
                <div className="absolute top-0 right-0 p-6 text-6xl opacity-20 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500">
                  {sport.icon}
                </div>
                <div className="relative z-10">
                  <motion.span 
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    className="text-4xl mb-4 block origin-center"
                  >
                    {sport.icon}
                  </motion.span>
                  <h3 className="text-2xl font-bold mb-2">{sport.name}</h3>
                  <div className="flex items-center text-sm font-bold text-white/60 group-hover:text-white transition-colors">
                    START ANALYSIS <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <section className="mt-20">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <History className="text-orange-500" />
            Recent History
          </h3>
          <Link to="/analytics" className="text-orange-500 font-bold hover:underline">View All Reports</Link>
        </div>
        <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
              <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Fetching Strategic Data...</p>
            </div>
          ) : history.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-bottom border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Sport</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Formation</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Strategy</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((report) => (
                  <HistoryRow 
                    key={report.id}
                    sport={report.sportType} 
                    formation={report.formation} 
                    strategy={report.strategy} 
                    date={report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : "Recent"} 
                    onClick={() => navigate(`/report/${report.id}`)}
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">No analysis history found. Start your first session above!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      className="bg-white/5 border border-white/10 p-6 rounded-2xl transition-colors group cursor-default"
    >
      <div className="flex justify-between items-start mb-4">
        <motion.div 
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          className="p-3 bg-white/5 rounded-xl group-hover:bg-orange-500/10 transition-colors"
        >
          {icon}
        </motion.div>
      </div>
      <h4 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">{title}</h4>
      <p className="text-3xl font-bold tracking-tighter">{value}</p>
    </motion.div>
  );
}

function HistoryRow({ sport, formation, strategy, date, onClick }: any) {
  return (
    <motion.tr 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      onClick={onClick}
      className="hover:bg-white/5 transition-colors group cursor-pointer"
    >
      <td className="px-6 py-4 font-bold uppercase text-xs tracking-widest">{sport}</td>
      <td className="px-6 py-4">
        <span className="px-3 py-1 bg-orange-500/10 text-orange-500 font-mono text-xs rounded-full border border-orange-500/20">
          {formation}
        </span>
      </td>
      <td className="px-6 py-4 text-blue-400 text-sm">{strategy}</td>
      <td className="px-6 py-4 text-gray-500 text-sm">{date}</td>
      <td className="px-6 py-4">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-white/5 hover:bg-orange-600 rounded-lg text-sm font-bold transition-all"
        >
          View Report
        </motion.button>
      </td>
    </motion.tr>
  );
}
