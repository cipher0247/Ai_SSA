import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { FileText, Download, Share2, ChevronLeft, Shield, Zap, Target, Award, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "reports", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setReport({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("Report not found.");
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `reports/${id}`);
      }
    };
    fetchReport();
  }, [id]);

  const downloadPDF = async () => {
    if (!reportRef.current || isDownloading) return;
    setIsDownloading(true);
    
    try {
      // Small delay to ensure all animations (framer-motion) are completed and layout is stable
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = reportRef.current;
      
      // Capture the element using html2canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true, // Handle cross-origin images (like picsum)
        backgroundColor: "#0a0a0c",
        logging: false,
        allowTaint: false, // Must be false to allow toDataURL() on cross-origin content
        scrollY: -window.scrollY,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          // You can modify the cloned document here if needed
          // e.g., ensuring certain elements are visible
          const clonedElement = clonedDoc.getElementById(element.id);
          if (clonedElement) {
            clonedElement.style.height = 'auto';
            clonedElement.style.overflow = 'visible';
          }
        }
      });

      if (!canvas) {
        throw new Error("Failed to capture report content.");
      }

      // Convert canvas to image data (JPEG for smaller PDF size)
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      // Initialize jsPDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Add extra pages if the content is longer than one A4 page
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`AI-SSA-Report-${id}-${new Date().getTime()}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
      // Fallback to browser print if PDF generation fails
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  if (error) return <div className="p-20 text-center text-red-500 font-bold">{error}</div>;
  if (!report) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-mono uppercase tracking-widest">Retrieving Report...</p>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 py-12"
    >
      <Link to="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors print:hidden">
        <ChevronLeft className="w-4 h-4" /> BACK TO DASHBOARD
      </Link>

      <div ref={reportRef} className="bg-[#0a0a0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-12 bg-gradient-to-br from-orange-600 to-orange-800"
        >
          <div className="flex justify-between items-start mb-8">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-black uppercase tracking-tighter mb-2"
              >
                Match Analysis
              </motion.h1>
              <p className="text-white/60 font-mono uppercase">REPORT ID: {id}</p>
            </div>
            <div className="flex gap-4 print:hidden">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={downloadPDF}
                disabled={isDownloading}
                className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <Share2 className="w-6 h-6" />
              </motion.button>
            </div>
          </div>

          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } }
            }}
            className="grid grid-cols-3 gap-8"
          >
            <ReportHeaderCard 
              icon={<Shield className="w-6 h-6 mx-auto mb-2 text-blue-400" />}
              label="Formation"
              value={report.formation}
            />
            <ReportHeaderCard 
              icon={<Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" />}
              label="Strategy"
              value={report.strategy}
            />
            <ReportHeaderCard 
              icon={<Target className="text-red-400 w-6 h-6 mx-auto mb-2" />}
              label="Confidence"
              value={`${Math.round(report.confidence * 100)}%`}
            />
          </motion.div>
        </motion.div>

        <div className="p-12 space-y-12">
          <section>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileText className="text-orange-500" />
              Strategic Summary
            </h3>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-gray-300 leading-relaxed">
              <p className="mb-4">The detected formation {report.formation} indicates a {report.strategy.toLowerCase()} approach. The team showed strong coordination in the mid-field but lacked depth in the final third.</p>
              <h4 className="text-white font-bold mb-2">Counter Strategy:</h4>
              <p>{report.counterStrategy || report.counter_strategy}</p>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Award className="text-yellow-500" />
              Player Performance Analysis
            </h3>
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.1 } }
              }}
              className="grid gap-4"
            >
              {report.playerStats?.map((stat: any, idx: number) => (
                <motion.div 
                  key={stat.id || idx} 
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                  className="p-6 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-orange-500/30 transition-colors cursor-default"
                >
                  <div>
                    <h4 className="text-lg font-bold mb-1">{stat.playerId || stat.player_id}</h4>
                    <p className="text-xs text-gray-500">Suggested Role: <span className="text-orange-500 font-bold">{stat.suggestedRole || stat.suggested_role}</span></p>
                  </div>
                  <div className="flex gap-8">
                    <StatMini label="Speed" value={stat.speed} />
                    <StatMini label="Movement" value={stat.movement} />
                    <StatMini label="Stability" value={stat.stability} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>

          <div className="pt-8 border-t border-white/10 text-center print:hidden">
            <p className="text-sm text-gray-500 mb-4 italic">"Next Match Winning Plan: Focus on wing transitions and high-intensity pressing in the first 20 minutes."</p>
            <button 
              onClick={downloadPDF}
              disabled={isDownloading}
              className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  GENERATING PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  DOWNLOAD FULL PDF REPORT
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ReportHeaderCard({ icon, label, value }: any) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 }
      }}
      className="text-center p-4 bg-black/20 rounded-2xl backdrop-blur-md"
    >
      {icon}
      <span className="text-[10px] uppercase tracking-widest block opacity-60">{label}</span>
      <span className="text-xl font-bold">{value}</span>
    </motion.div>
  );
}

function StatMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">{label}</span>
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="text-sm font-bold"
      >
        {value.toFixed(1)}
      </motion.span>
    </div>
  );
}
