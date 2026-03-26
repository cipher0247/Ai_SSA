import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend
} from 'recharts';
import { motion } from 'motion/react';
import { Users, Activity, TrendingUp, Award } from 'lucide-react';

const PLAYER_DATA = [
  { name: 'Player 1', movement: 85, speed: 70, participation: 90, stability: 60 },
  { name: 'Player 2', movement: 40, speed: 55, participation: 65, stability: 95 },
  { name: 'Player 3', movement: 75, speed: 85, participation: 70, stability: 50 },
  { name: 'Player 4', movement: 60, speed: 65, participation: 80, stability: 75 },
];

const TEAM_COMPARISON = [
  { subject: 'Attack', TeamA: 120, TeamB: 110, fullMark: 150 },
  { subject: 'Defense', TeamA: 98, TeamB: 130, fullMark: 150 },
  { subject: 'Possession', TeamA: 86, TeamB: 130, fullMark: 150 },
  { subject: 'Coordination', TeamA: 99, TeamB: 100, fullMark: 150 },
  { subject: 'Speed', TeamA: 85, TeamB: 90, fullMark: 150 },
];

const PERFORMANCE_TREND = [
  { time: '10m', intensity: 40 },
  { time: '20m', intensity: 65 },
  { time: '30m', intensity: 80 },
  { time: '40m', intensity: 55 },
  { time: '50m', intensity: 90 },
  { time: '60m', intensity: 75 },
];

export default function AnalyticsPage({ user }: any) {
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
              <BarChart data={PLAYER_DATA}>
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
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={TEAM_COMPARISON}>
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
              <LineChart data={PERFORMANCE_TREND}>
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
            <RoleSuggestion 
              player="Player 1" 
              role="STRIKER" 
              reason="High movement and speed metrics suggest offensive dominance." 
            />
            <RoleSuggestion 
              player="Player 2" 
              role="DEFENDER" 
              reason="Exceptional position stability and defensive coordination." 
            />
            <RoleSuggestion 
              player="Player 3" 
              role="WINGER" 
              reason="Top-tier speed and participation in transition phases." 
            />
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
