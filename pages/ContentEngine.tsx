
import React, { useState, useRef, useEffect } from 'react';
import { generateBrandingContent, generateMarketingImage, generateSpeech } from '../services/geminiService';
import { db, auth } from '../services/firebaseService';
import { ref, push, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

interface HistoryItem {
  id?: string;
  timestamp: number;
  prompt: string;
  platform: string;
  result: any;
  imageBase64: string | null;
  scriptAudioBase64: string | null;
  mainAudioBase64: string | null;
  voiceName: string | null;
}

const ContentEngine: React.FC<{ profile: any }> = ({ profile }) => {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('All Platforms');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [scriptAudioBase64, setScriptAudioBase64] = useState<string | null>(null);
  const [mainAudioBase64, setMainAudioBase64] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [voiceUsage, setVoiceUsage] = useState(0);
  
  const [playingType, setPlayingType] = useState<'none' | 'script' | 'main'>('none');
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const user = auth.currentUser;

  const platforms = ['All Platforms', 'LinkedIn', 'Instagram', 'Twitter/X', 'YouTube'];
  const voices = [
    { id: 'M1', name: 'Puck', label: 'Liam (Professional)', type: 'male' },
    { id: 'M2', name: 'Charon', label: 'Noah (Deep)', type: 'male' },
    { id: 'M3', name: 'Fenrir', label: 'Oliver (Warm)', type: 'male' },
    { id: 'F1', name: 'Kore', label: 'Emma (Bright)', type: 'female' },
    { id: 'F2', name: 'Zephyr', label: 'Sophia (Calm)', type: 'female' },
    { id: 'F3', name: 'Kore', label: 'Mia (Business)', type: 'female' },
  ];

  const isPro = profile?.status === 'Pro';
  const isEnterprise = profile?.status === 'Enterprise';

  const postLimit = isEnterprise ? 50 : isPro ? 20 : 3;
  const voiceLimit = isEnterprise ? 50 : isPro ? 3 : 0;

  useEffect(() => {
    if (!user) return;
    const historyRef = ref(db, `users/${user.uid}/history`);
    const today = new Date().toISOString().split('T')[0];
    const usageRef = ref(db, `users/${user.uid}/usage/${today}`);
    
    onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).sort((a, b) => b.timestamp - a.timestamp);
        setHistory(list);
      } else {
        setHistory([]);
      }
    });

    onValue(usageRef, (snap) => {
      const usageData = snap.val() || { posts: 0, voices: 0 };
      setDailyUsage(usageData.posts || 0);
      setVoiceUsage(usageData.voices || 0);
    });

    return () => stopCurrentAudio();
  }, [user]);

  const stopCurrentAudio = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (e) {}
      currentSourceRef.current = null;
    }
    setPlayingType('none');
  };

  const handleGeneratePerfectPack = async () => {
    if (!prompt.trim() || !user) return;
    stopCurrentAudio();

    if (dailyUsage >= postLimit) {
      alert(`Daily limit reached. Upgrade for more.`);
      return;
    }

    setLoading(true);
    setResult(null);
    setImageBase64(null);
    setScriptAudioBase64(null);
    setMainAudioBase64(null);

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    try {
      const contentBundle = await generateBrandingContent(prompt, platform);
      setResult(contentBundle);

      const [imageData, sAudio, mAudio] = await Promise.all([
        generateMarketingImage(contentBundle.visualPrompt),
        voiceUsage < voiceLimit ? generateSpeech(contentBundle.videoScript.substring(0, 1000), selectedVoice) : Promise.resolve(null),
        voiceUsage < voiceLimit ? generateSpeech(contentBundle.mainContent.substring(0, 1000), selectedVoice) : Promise.resolve(null)
      ]);
      
      setImageBase64(imageData || null);
      setScriptAudioBase64(sAudio || null);
      setMainAudioBase64(mAudio || null);

      const newItem: HistoryItem = {
        timestamp: Date.now(),
        prompt,
        platform,
        result: contentBundle,
        imageBase64: imageData || null,
        scriptAudioBase64: sAudio || null,
        mainAudioBase64: mAudio || null,
        voiceName: selectedVoice
      };
      
      await push(ref(db, `users/${user.uid}/history`), newItem);
      
      const today = new Date().toISOString().split('T')[0];
      await set(ref(db, `users/${user.uid}/usage/${today}`), {
        posts: dailyUsage + 1,
        voices: (sAudio || mAudio) ? voiceUsage + 1 : voiceUsage
      });

    } catch (error) {
      console.error(error);
      alert("Error generating pack.");
    } finally {
      setLoading(false);
    }
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const createWavHeader = (pcmLength: number, sampleRate: number) => {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    view.setUint32(0, 0x52494646, false); 
    view.setUint32(4, 36 + pcmLength, true); 
    view.setUint32(8, 0x57415645, false); 
    view.setUint32(12, 0x666d7420, false); 
    view.setUint16(16, 16, true); 
    view.setUint16(20, 1, true); 
    view.setUint16(22, 1, true); 
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); 
    view.setUint16(34, 16, true); 
    view.setUint32(36, 0x64617461, false); 
    view.setUint32(40, pcmLength, true);
    return header;
  };

  const downloadVoice = (audioBase64: string, prefix: string) => {
    if (!audioBase64) return;
    const pcmData = decode(audioBase64);
    const header = createWavHeader(pcmData.length, 24000);
    const wavBlob = new Blob([header, pcmData], { type: 'audio/wav' });
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bf_${prefix}_voice_${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsset = (type: 'image') => {
    const a = document.createElement('a');
    if (type === 'image' && imageBase64) {
      a.href = `data:image/png;base64,${imageBase64}`;
      a.download = `bf_visual_${Date.now()}.png`;
      a.click();
    }
  };

  const playAudio = async (audioBase64: string, type: 'script' | 'main') => {
    if (!audioBase64 || !audioContextRef.current) return;
    if (playingType === type) {
      stopCurrentAudio();
      return;
    }
    stopCurrentAudio();
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    try {
      const data = decode(audioBase64);
      const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
      const frameCount = dataInt16.length;
      const buffer = audioContextRef.current.createBuffer(1, frameCount, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        if (currentSourceRef.current === source) {
          setPlayingType('none');
          currentSourceRef.current = null;
        }
      };
      setPlayingType(type);
      currentSourceRef.current = source;
      source.start();
    } catch (err) {
      console.error("Playback failed", err);
      setPlayingType('none');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-10 pb-20">
      {/* Platform Selector & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 shrink-0 scroll-smooth">
          {platforms.map(p => (
            <button key={p} onClick={() => setPlatform(p)} className={`px-4 sm:px-6 h-10 sm:h-11 rounded-full text-[9px] sm:text-[10px] font-black uppercase border transition-all shrink-0 active:scale-95 ${platform === p ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>{p}</button>
          ))}
        </div>
        <div className="flex items-center gap-5 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50 backdrop-blur-sm self-end sm:self-center">
          <div className="flex flex-col items-center px-2">
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">Quota</p>
            <p className="text-[11px] font-black text-white">{dailyUsage}/{postLimit}</p>
          </div>
          <div className="w-px h-6 bg-slate-800"></div>
          <div className="flex flex-col items-center px-2">
            <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest mb-1">Audio</p>
            <p className="text-[11px] font-black text-blue-400">{voiceUsage}/{voiceLimit}</p>
          </div>
        </div>
      </div>

      {/* Input Module */}
      <div className="bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] p-5 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        <textarea
          className="w-full bg-slate-950/80 border border-slate-800 rounded-3xl px-5 sm:px-7 py-5 sm:py-6 text-sm sm:text-base text-slate-200 outline-none min-h-[160px] placeholder:text-slate-800 focus:border-blue-600/50 transition-all resize-none shadow-inner"
          placeholder="Enter your vision... (e.g. Story about a futuristic startup, LinkedIn branding strategy, or YouTube script)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        {voiceLimit > 0 && (
          <div className="space-y-3">
            <p className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] ml-4">Select AI Narration Tone</p>
            <select 
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl h-14 sm:h-16 px-6 text-xs sm:text-sm text-slate-300 outline-none shadow-inner focus:border-slate-700 appearance-none transition-all"
            >
              {voices.map(v => <option key={v.id} value={v.name}>{v.label}</option>)}
            </select>
          </div>
        )}

        <button
          onClick={handleGeneratePerfectPack}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white h-16 sm:h-20 rounded-3xl font-black shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 text-sm sm:text-base uppercase tracking-widest flex items-center justify-center gap-4"
        >
          {loading ? <i className="fas fa-bolt animate-pulse text-lg"></i> : <i className="fas fa-magic text-lg"></i>}
          {loading ? 'Synthesizing Vision...' : 'Generate Perfect Pack'}
        </button>
      </div>

      {/* Result Module */}
      {result && (
        <div className="space-y-8 sm:space-y-12 animate-in slide-in-from-bottom-8 duration-700 px-1">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg border border-blue-500/20 uppercase tracking-[0.2em]">{result.mode}</span>
              <span className="text-[9px] font-black bg-slate-800 text-slate-500 px-3 py-1 rounded-lg border border-slate-700 uppercase tracking-[0.2em]">{result.detectedLanguage}</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter leading-[1.1]">"{result.title}"</h3>
          </div>

          <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl relative flex items-center justify-center">
             {imageBase64 ? (
               <div className="w-full group">
                 <img src={`data:image/png;base64,${imageBase64}`} className="w-full rounded-[2rem] aspect-square object-cover shadow-lg transition-transform duration-1000 group-hover:scale-105" alt="AI Generated" />
                 <button 
                   onClick={() => downloadAsset('image')}
                   className="absolute top-6 right-6 w-12 h-12 sm:w-14 sm:h-14 bg-slate-950/90 backdrop-blur-xl rounded-2xl text-white flex items-center justify-center hover:bg-blue-600 transition-all shadow-2xl border border-white/10 active:scale-90"
                   title="Download Image"
                 >
                   <i className="fas fa-download text-lg"></i>
                 </button>
               </div>
             ) : (
               <div className="aspect-square w-full flex flex-col items-center justify-center text-slate-700 space-y-5 bg-slate-950/20">
                 <div className="w-14 h-14 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Rendering 4K Visual Asset</p>
               </div>
             )}
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="bg-slate-900/60 p-6 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-8">
              <div className="bg-slate-950 p-6 sm:p-8 rounded-[2rem] border border-slate-900/50 shadow-inner group">
                <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-5 border-l-2 border-blue-500 pl-3">AI Narration Script</p>
                <p className="text-base sm:text-lg text-slate-400 italic mb-8 whitespace-pre-wrap leading-relaxed font-medium">{result.videoScript}</p>
                
                {scriptAudioBase64 ? (
                  <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <button 
                      onClick={() => playAudio(scriptAudioBase64, 'script')} 
                      className={`flex-1 h-14 sm:h-16 ${playingType === 'script' ? 'bg-rose-600' : 'bg-emerald-600'} text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95`}
                    >
                      <i className={`fas ${playingType === 'script' ? 'fa-stop' : 'fa-play'}`}></i> 
                      {playingType === 'script' ? 'Stop Narration' : 'Listen Production Script'}
                    </button>
                    <button onClick={() => downloadVoice(scriptAudioBase64, 'script')} className="w-full sm:w-16 h-14 sm:h-16 bg-slate-900 text-slate-400 rounded-2xl font-black flex items-center justify-center border border-slate-800 hover:text-white transition-colors active:scale-95">
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                ) : (
                  voiceLimit > 0 && <div className="h-16 flex items-center justify-center text-[10px] font-black text-slate-800 uppercase tracking-widest animate-pulse">Synthesizing Audio Stream...</div>
                )}
              </div>

              <div className="bg-slate-950 p-6 sm:p-8 rounded-[2rem] border border-slate-900/50 shadow-inner">
                <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4 border-l-2 border-indigo-500 pl-3">Main Body Copy</p>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8 font-medium">{result.mainContent}</p>
                
                {mainAudioBase64 && (
                  <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <button 
                      onClick={() => playAudio(mainAudioBase64, 'main')} 
                      className={`flex-1 h-14 sm:h-16 ${playingType === 'main' ? 'bg-rose-600' : 'bg-blue-600'} text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95`}
                    >
                      <i className={`fas ${playingType === 'main' ? 'fa-stop' : 'fa-play'}`}></i> 
                      {playingType === 'main' ? 'Stop Content' : 'Listen Body Text'}
                    </button>
                    <button onClick={() => downloadVoice(mainAudioBase64, 'content')} className="w-full sm:w-16 h-14 sm:h-16 bg-slate-900 text-slate-400 rounded-2xl font-black flex items-center justify-center border border-slate-800 hover:text-white active:scale-95">
                      <i className="fas fa-download"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Module */}
      {history.length > 0 && (
        <div className="pt-16 sm:pt-24 space-y-8">
          <div className="px-4 text-center sm:text-left">
            <h3 className="text-2xl font-black text-white italic tracking-tight">AI Cloud Library</h3>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">Saved Brand Assets</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-1">
            {history.map((item) => (
              <div key={item.id} onClick={() => {
                setPrompt(item.prompt);
                setPlatform(item.platform);
                setResult(item.result);
                setImageBase64(item.imageBase64);
                setScriptAudioBase64(item.scriptAudioBase64);
                setMainAudioBase64(item.mainAudioBase64);
                if (item.voiceName) setSelectedVoice(item.voiceName);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className="bg-slate-900/30 backdrop-blur-md p-5 rounded-[2.5rem] border border-slate-800 flex items-center gap-5 hover:bg-slate-800/40 hover:border-slate-700 cursor-pointer group transition-all active:scale-[0.98]">
                <div className="w-20 h-20 rounded-2xl bg-slate-950 overflow-hidden shrink-0 border border-slate-800 shadow-xl">
                  {item.imageBase64 ? (
                    <img src={`data:image/png;base64,${item.imageBase64}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="prev" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-800"><i className="fas fa-image text-xl"></i></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[7px] font-black text-blue-400 uppercase bg-blue-500/5 px-2.5 py-1 rounded-md border border-blue-500/10 tracking-widest">{item.result.detectedLanguage}</span>
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{item.platform}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-300 truncate group-hover:text-white transition-colors">{item.prompt}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentEngine;
