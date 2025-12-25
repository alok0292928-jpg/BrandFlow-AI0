
import React, { useState, useEffect } from 'react';
import { processVoiceToTask } from '../services/geminiService';
import { db, auth } from '../services/firebaseService';
import { ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const BusinessSaaS: React.FC<{ profile: any }> = ({ profile }) => {
  const [voiceLog, setVoiceLog] = useState<any[]>([]);
  const [transcription, setTranscription] = useState('');
  const [processing, setProcessing] = useState(false);
  const user = auth.currentUser;

  const isEnterprise = profile?.status === 'Enterprise';

  const inventory = [
    { id: '1', name: 'Cotton T-Shirts', stock: 450, price: 12.99, icon: 'fa-shirt' },
    { id: '2', name: 'Premium Jeans', stock: 120, price: 54.50, icon: 'fa-user-ninja' },
    { id: '3', name: 'Hoodies', stock: 85, price: 39.99, icon: 'fa-mitten' },
  ];

  useEffect(() => {
    if (!user) return;
    const logRef = ref(db, `users/${user.uid}/businessLog`);
    return onValue(logRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setVoiceLog(Object.values(data).reverse());
      }
    });
  }, [user]);

  const handleSimulateVoice = async () => {
    if (!isEnterprise) {
      alert("Voice-to-Task is an Enterprise feature. Please upgrade your plan.");
      return;
    }
    if (!transcription.trim() || !user) return;
    setProcessing(true);
    try {
      const task = await processVoiceToTask(transcription);
      await push(ref(db, `users/${user.uid}/businessLog`), {
        ...task,
        timestamp: Date.now()
      });
      setTranscription('');
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-white leading-tight tracking-tight">B2B Suite</h2>
        <p className="text-slate-400 font-medium">Enterprise Resources</p>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-7 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
        {!isEnterprise && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8 text-center">
            <i className="fas fa-lock text-3xl text-indigo-500 mb-4"></i>
            <h4 className="font-black text-lg">Enterprise Feature</h4>
            <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">Upgrade to unlock Voice-to-Task automation</p>
          </div>
        )}
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
            <i className="fas fa-microphone text-xl animate-pulse"></i>
          </div>
          <div>
            <h3 className="font-black text-lg">Voice-to-Task</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Workflow Engine</p>
          </div>
        </div>
        
        <textarea 
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-sm text-slate-200 outline-none mb-4 min-h-[100px]"
          placeholder="Record voice or type business update..."
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
        ></textarea>

        <button 
          onClick={handleSimulateVoice}
          className="w-full py-5 bg-white text-slate-950 rounded-[1.5rem] font-black shadow-xl"
        >
          {processing ? 'Processing...' : 'Execute Update'}
        </button>

        {voiceLog.length > 0 && (
          <div className="mt-8 space-y-3">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Log</h4>
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{voiceLog[0].type}</span>
              <p className="text-sm text-slate-200 font-medium mt-1">{voiceLog[0].summary}</p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Live Inventory</h3>
        <div className="space-y-4">
          {inventory.map((item) => (
            <div key={item.id} className="bg-slate-900/40 backdrop-blur-sm p-5 rounded-[2rem] border border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400"><i className={`fas ${item.icon} text-lg`}></i></div>
                <div>
                  <p className="font-bold text-white text-sm">{item.name}</p>
                  <p className="text-[10px] font-black text-slate-500">Stock: {item.stock}</p>
                </div>
              </div>
              <p className="font-black text-white text-sm">${item.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessSaaS;
