
import React, { useState, useEffect, useRef } from 'react';
import { processVoiceToTask } from '../services/geminiService';
import { db, auth } from '../services/firebaseService';
import { ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const BusinessSaaS: React.FC<{ profile: any }> = ({ profile }) => {
  const [voiceLog, setVoiceLog] = useState<any[]>([]);
  const [transcription, setTranscription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
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
        setVoiceLog(Object.values(data).sort((a: any, b: any) => b.timestamp - a.timestamp));
      }
    });
  }, [user]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          await handleProcessAudio(base64Data);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
      alert("Microphone access is required for Voice-to-Task.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleProcessAudio = async (base64Data: string) => {
    if (!user) return;
    setProcessing(true);
    try {
      const task = await processVoiceToTask({ data: base64Data, mimeType: 'audio/webm' });
      await push(ref(db, `users/${user.uid}/businessLog`), {
        ...task,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(error);
      alert("AI failed to parse audio. Try again or use text.");
    } finally {
      setProcessing(false);
    }
  };

  const handleTextExecute = async () => {
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
    <div className="w-full max-w-xl mx-auto space-y-8 sm:space-y-12">
      <div className="text-center sm:text-left">
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight italic">B2B Core Suite</h2>
        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] mt-2">Enterprise Resource Sync</p>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] p-6 sm:p-10 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
        {!isEnterprise && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl z-10 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <i className="fas fa-lock text-4xl text-indigo-500 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"></i>
            <h4 className="font-black text-xl italic uppercase tracking-widest">Enterprise Only</h4>
            <p className="text-[10px] text-slate-500 mt-4 font-black uppercase tracking-[0.2em] leading-relaxed max-w-[200px]">Unlock Real-Time Voice-to-Task Automation with Pro Tiers</p>
          </div>
        )}
        
        <div className="flex items-center gap-5 mb-8">
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.8rem] flex items-center justify-center transition-all shadow-2xl ${isRecording ? 'bg-rose-600 animate-pulse scale-110 shadow-rose-500/30' : 'bg-blue-600 shadow-blue-500/20 active:scale-95'}`}
          >
            <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-xl sm:text-2xl`}></i>
          </button>
          <div className="flex-1">
            <h3 className="font-black text-lg sm:text-xl italic">
              {isRecording ? 'AI is Listening...' : processing ? 'Processing Task...' : 'Voice-to-Task'}
            </h3>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Direct Operational Control</p>
          </div>
        </div>
        
        <div className="relative group">
          <textarea 
            className="w-full bg-slate-950/50 border border-slate-800 rounded-3xl p-6 text-sm text-slate-200 outline-none mb-4 min-h-[140px] focus:border-blue-500/30 transition-all placeholder:text-slate-800"
            placeholder="Tell BrandFlow to update inventory, log a sale, or coordinate logistics..."
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
          ></textarea>
        </div>

        <button 
          onClick={handleTextExecute}
          disabled={processing || (!transcription.trim() && !isRecording)}
          className="w-full h-16 sm:h-20 bg-white text-slate-950 rounded-[1.8rem] font-black shadow-2xl shadow-white/5 active:scale-[0.98] transition-all text-xs sm:text-sm uppercase tracking-widest disabled:opacity-50"
        >
          {processing ? 'Decrypting Protocol...' : 'Execute Data Entry'}
        </button>

        {voiceLog.length > 0 && (
          <div className="mt-10 space-y-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-4">Latest Operations</p>
            <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800/50 shadow-inner group">
              <div className="flex items-center gap-3 mb-3">
                 <span className="text-[8px] font-black text-blue-400 uppercase bg-blue-500/5 px-2.5 py-1 rounded-md border border-blue-500/10 tracking-widest">{voiceLog[0].type}</span>
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{new Date(voiceLog[0].timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-sm text-slate-400 font-bold italic leading-relaxed group-hover:text-white transition-colors">"{voiceLog[0].summary}"</p>
              <div className="mt-4 pt-4 border-t border-slate-900 flex gap-6">
                 <div>
                    <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Asset</p>
                    <p className="text-[10px] font-black text-white">{voiceLog[0].data?.item || 'N/A'}</p>
                 </div>
                 <div>
                    <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Qty</p>
                    <p className="text-[10px] font-black text-white">{voiceLog[0].data?.amount || '0'}</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-4">Cloud Inventory Real-Time</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {inventory.map((item) => (
            <div key={item.id} className="bg-slate-900/30 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-800 shadow-sm flex items-center justify-between group hover:border-slate-700 transition-all cursor-default">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-500 border border-slate-800 group-hover:text-blue-400 transition-colors shadow-lg"><i className={`fas ${item.icon} text-xl`}></i></div>
                <div>
                  <p className="font-black text-white text-sm tracking-tight">{item.name}</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Stock Unit: {item.stock}</p>
                </div>
              </div>
              <p className="font-black text-white text-base">${item.price}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessSaaS;
