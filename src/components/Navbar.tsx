import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Activity, Camera, BarChart2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export default function Navbar({ user, onLogout }: { user: { userId: string; username: string }; onLogout: () => void }) {
  const navigate = useNavigate();

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-40 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-orange-600/50 blur-lg rounded-full"
            />
            <div className="relative w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20 group-hover:rotate-12 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter uppercase leading-none">AI-SSA</span>
            <span className="text-[8px] text-orange-500 font-bold tracking-[0.2em] uppercase">Tactical Engine</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <NavLink to="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
          <NavLink to="/live" icon={<Camera className="w-4 h-4" />} label="Live AI" />
          <NavLink to="/analytics" icon={<BarChart2 className="w-4 h-4" />} label="Analytics" />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold">{user.username}</span>
          </div>
          <button 
            onClick={() => { onLogout(); navigate("/"); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
      {icon}
      {label}
    </Link>
  );
}
