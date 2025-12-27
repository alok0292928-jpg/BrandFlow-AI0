
import React, { useState, useEffect } from 'react';
import { analyzeHealthData } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { db, auth } from '../services/firebaseService';
import { ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const HealthDashboard: React.FC = () => {
  const [lifestyle, setLifestyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const user = auth.currentUser;

  const mockData = [{ name: 'Focus', value: 75 }, { name: 'Rest', value: 25 }];
  const COLORS = ['#3b82f6', '#1e293b'];

  const sleepData = [
    { day: 'M', hours: 7.2 },
    { day: 'T', hours: 6.5 },
    { day: 'W', hours: 8.0 },
    { day: 'T', hours: 7.1 },
    { day: 'F', hours: 6.8 },
  ];

  useEffect(() => {
    if (!user) return;
    const healthRef = ref(db, `users/${user.uid}/healthReports`);
    return onValue(healthRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reports = Object.values(data);
        setReport(reports[reports.length - 1]);
      }
    });
  }, [user]);

  const handleAnalyze = async () => {
    if (!lifestyle.trim() || !user) return;
    setLoading(true);
    try {
      const data = await analyzeHealthData(lifestyle);
      setReport(data);
      await push(ref(db, `users/${user.uid}/healthReports`), {
        ...data,
        lifestyleUsed: lifestyle,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 sm:space-y-12">
      <div className="text-center sm:text-left">
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight italic">Bio-Hacking Cloud</h2>
        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] mt-2">Founder Vital Intelligence</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden flex flex-col items-center">
          <div className="w-32 h-32 relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mockData} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={4} stroke="none" dataKey="value">
                    {mockData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-black text-white text-xl">75%</span>
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Efficiency</span>
             </div>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6">Core Performance Focus</p>
        </div>
        
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl flex flex-col items-center justify-center">
           <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={20} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 900}} />
                </BarChart>
              </ResponsiveContainer>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6">Weekly Recovery Cycle</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-rose-600 to-rose-900 rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <h3 className="font-black text-2xl mb-6 italic flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner"><i className="fas fa-heart-pulse"></i></div>
          Founder Vital Scan
        </h3>
        <textarea 
          className="w-full bg-black/30 border border-white/20 rounded-3xl p-6 text-sm sm:text-base text-white placeholder-rose-200/50 focus:ring-2 focus:ring-white/50 outline-none mb-6 min-h-[140px] shadow-inner resize-none transition-all"
          placeholder="Detailed lifestyle update (e.g. Current stress, sleep quality, diet, energy levels...)"
          value={lifestyle}
          onChange={(e) => setLifestyle(e.target.value)}
        ></textarea>
        <button 
          onClick={handleAnalyze}
          disabled={loading || !lifestyle}
          className="w-full h-16 sm:h-20 bg-white text-rose-950 rounded-[1.8rem] font-black active:scale-[0.98] transition-all shadow-2xl shadow-rose-950/40 text-sm uppercase tracking-widest flex items-center justify-center gap-3"
        >
          {loading ? <i className="fas fa-dna animate-spin text-lg"></i> : <i className="fas fa-wave-square text-lg"></i>}
          {loading ? "Decrypting Biology..." : "Generate Cloud Report"}
        </button>
      </div>

      {report && (
        <div className="space-y-8 animate-in zoom-in-95 duration-700">
           <div className="bg-slate-900/60 p-8 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-inner">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6 border-l-2 border-rose-500 pl-4">AI Bio-Clinical Analysis</h4>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium">{report.analysis}</p>
           </div>
           
           <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] text-slate-950 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><i className="fas fa-list-check"></i></div>
                 <div>
                    <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.4em]">Optimization Plan</h4>
                    <p className="font-black text-lg text-slate-900 tracking-tight leading-none mt-1">Foundational Directives</p>
                 </div>
              </div>
              <div className="space-y-4">
                 {report.recommendations.map((tip: string, i: number) => (
                    <div key={i} className="flex gap-5 items-start bg-slate-50 p-5 rounded-3xl border border-slate-100 hover:border-rose-200 transition-colors">
                       <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg">{i+1}</span>
                       <p className="text-sm sm:text-base text-slate-800 leading-snug font-bold pt-1">{tip}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HealthDashboard;
