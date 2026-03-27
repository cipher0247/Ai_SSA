import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import AnalysisPage from "./pages/AnalysisPage";
import LiveMode from "./pages/LiveMode";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReportPage from "./pages/ReportPage";
import Chatbot from "./components/Chatbot";
import Navbar from "./components/Navbar";
import { auth } from "./firebase";

function AnimatedRoutes({ user, setUser, logout }: any) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/auth" element={<AuthPage onLogin={setUser} />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/auth" />} />
          <Route path="/analysis/:sport" element={user ? <AnalysisPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/live" element={user ? <LiveMode /> : <Navigate to="/auth" />} />
          <Route path="/analytics" element={user ? <AnalyticsPage user={user} /> : <Navigate to="/auth" />} />
          <Route path="/report/:id" element={user ? <ReportPage /> : <Navigate to="/auth" />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

// PageWrapper is no longer needed as we animate the whole Routes container

export default function App() {
  const [user, setUser] = useState<{ userId: string; username: string } | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const userData = { 
          userId: firebaseUser.uid, 
          username: firebaseUser.email || firebaseUser.displayName || "User" 
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem("user");
      setUser(null);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-mono uppercase tracking-widest">Initializing AI-SSA...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-orange-500 selection:text-white">
        {user && <Navbar user={user} onLogout={logout} />}
        <AnimatedRoutes user={user} setUser={setUser} logout={logout} />
        <Chatbot />
      </div>
    </Router>
  );
}
