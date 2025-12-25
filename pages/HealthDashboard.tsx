
import React, { useState, useEffect } from 'react';
import { analyzeHealthData } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar } from 'recharts';
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
        setReport(reports[reports.length - 1]); // Show latest
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
    <div className="w-full max-w-md mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white leading-tight tracking-tight">Bio-Hacking</h2>
        <p className="text-slate-400 font-medium">Founder Wellness Cloud</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="h-28 mx-auto relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mockData} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={2} stroke="none" dataKey="value">
                    {mockData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center font-black text-white text-sm">75%</div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mt-2">Core Focus</p>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-800 shadow-xl">
           <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepData}>
                  <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mt-2">Rest Index</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-rose-600 to-rose-900 rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden">
        <h3 className="font-black text-xl mb-4 italic flex items-center gap-3">
          <i className="fas fa-heart-pulse"></i> Vital Scan
        </h3>
        <textarea 
          className="w-full bg-black/30 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder-rose-200 focus:ring-2 focus:ring-white outline-none mb-4 min-h-[100px]"
          placeholder="How is your body feeling today?"
          value={lifestyle}
          onChange={(e) => setLifestyle(e.target.value)}
        ></textarea>
        <button 
          onClick={handleAnalyze}
          disabled={loading || !lifestyle}
          className="w-full py-5 bg-white text-rose-900 rounded-[1.5rem] font-black active:scale-95 transition-all shadow-xl"
        >
          {loading ? <i className="fas fa-dna animate-spin"></i> : "Generate Cloud Report"}
        </button>
      </div>

      {report && (
        <div className="space-y-6 animate-in zoom-in-95 duration-700">
           <div className="bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-800">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">AI Clinical Analysis</h4>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">{report.analysis}</p>
           </div>
           <div className="bg-white p-7 rounded-[2.5rem] text-slate-950">
              <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-5">Founder Optimization Plan</h4>
              <div className="space-y-4">
                 {report.recommendations.map((tip: string, i: number) => (
                    <div key={i} className="flex gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shrink-0">{i+1}</span>
                       <p className="text-xs text-slate-700 leading-snug font-bold">{tip}</p>
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
