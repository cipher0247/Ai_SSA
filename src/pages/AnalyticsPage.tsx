import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend
} from 'recharts';
import { motion } from 'motion/react';
import { Users, Activity, TrendingUp, Award, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

export default function AnalyticsPage({ user }: { user: { userId: string; username: string } }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const q = query(
          collection(db, "reports"),
          where("userId", "==", user.userId),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReports(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user.userId]);

  // Aggregate data for charts
  const playerData = reports.length > 0 ? reports[0].playerStats?.slice(0, 5).map((p: any) => ({
    name: p.playerId,
    movement: p.movement * 10,
    speed: p.speed * 10,
    participation: p.participation * 10,
    stability: p.stability * 10
  })) : [];

  const teamComparison = reports.length > 0 ? [
    { subject: 'Attack', TeamA: reports[0].playerPerformanceScore, TeamB: 70, fullMark: 100 },
    { subject: 'Defense', TeamA: 80, TeamB: 85, fullMark: 100 },
    { subject: 'Possession', TeamA: 65, TeamB: 60, fullMark: 100 },
    { subject: 'Coordination', TeamA: 90, TeamB: 80, fullMark: 100 },
    { subject: 'Speed', TeamA: 75, TeamB: 70, fullMark: 100 },
  ] : [];

  const performanceTrend = reports.slice(0, 6).reverse().map((r, i) => ({
    time: r.createdAt?.toDate ? r.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `T-${i}`,
    intensity: r.playerPerformanceScore
  }));

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-mono uppercase tracking-widest">Compiling Analytics...</p>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">No Data Available</h2>
        <p className="text-gray-500 mb-8">Run your first AI analysis to see performance metrics here.</p>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-orange-600 text-white font-bold rounded-xl"
          onClick={() => window.location.href = '/dashboard'}
        >
          START ANALYSIS
        </motion.button>
      </div>
    );
  }
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="mb-12">
        <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Performance Analytics</h2>
        <p className="text-gray-500">Deep dive into player metrics and team dynamics.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Player Comparison */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <Users className="text-orange-500" />
            <h3 className="text-xl font-bold">Player Comparison</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={playerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="movement" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="speed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Team Radar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <Activity className="text-blue-500" />
            <h3 className="text-xl font-bold">Team Dynamics</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={teamComparison}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" stroke="#666" />
                <PolarRadiusAxis stroke="#333" />
                <Radar name="Team Alpha" dataKey="TeamA" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                <Radar name="Team Beta" dataKey="TeamB" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2 bg-white/5 border border-white/10 p-8 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="text-green-500" />
            <h3 className="text-xl font-bold">Match Intensity Trend</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1c', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="intensity" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white/5 border border-white/10 p-8 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <Award className="text-yellow-500" />
            <h3 className="text-xl font-bold">AI Role Suggestions</h3>
          </div>
            <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="space-y-6"
          >
            {reports[0].playerStats?.slice(0, 3).map((p: any) => (
              <RoleSuggestion 
                key={p.playerId}
                player={p.playerId} 
                role={p.suggestedRole || "PLAYER"} 
                reason={`Performance score of ${Math.round(p.movement * 10)} in movement suggests high tactical adaptability.`} 
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function RoleSuggestion({ player, role, reason }: any) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 }
      }}
      whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors cursor-default"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">{player}</span>
        <motion.span 
          whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
          className="text-[10px] bg-orange-600 px-2 py-1 rounded font-black tracking-widest"
        >
          {role}
        </motion.span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{reason}</p>
    </motion.div>
  );
}
