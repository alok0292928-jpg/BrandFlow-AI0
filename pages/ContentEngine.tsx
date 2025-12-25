
import React, { useState, useRef, useEffect } from 'react';
import { generateBrandingContent, generateMarketingImage, generateSpeech, generateAIVideo } from '../services/geminiService';
import { db, auth } from '../services/firebaseService';
import { ref, push, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

interface HistoryItem {
  id?: string;
  timestamp: number;
  prompt: string;
  platform: string;
  result: any;
  imageBase64: string | null;
  audioBase64: string | null;
  voiceName: string | null;
  videoUrl?: string | null;
}

const ContentEngine: React.FC<{ profile: any }> = ({ profile }) => {
  const [prompt, setPrompt] = useState('');
  const [platform, setPlatform] = useState('All Platforms');
  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatus, setVideoStatus] = useState('');
  const [result, setResult] = useState<any>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [voiceUsage, setVoiceUsage] = useState(0);
  
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

  // Plan Definitions
  const isFree = !profile || profile.status === 'Free User' || profile.status === 'Free';
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
  }, [user]);

  const handleGeneratePerfectPack = async () => {
    if (!prompt.trim() || !user) return;

    if (dailyUsage >= postLimit) {
      alert(`Daily limit of ${postLimit} posts reached. Upgrade for more.`);
      return;
    }

    setLoading(true);
    setResult(null);
    setImageBase64(null);
    setAudioBase64(null);
    setVideoUrl(null);

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    try {
      const contentBundle = await generateBrandingContent(prompt, platform);
      setResult(contentBundle);

      const imagePromise = generateMarketingImage(contentBundle.visualPrompt);
      
      // Determine if voice is allowed for this generation
      let audioData = null;
      if (voiceUsage < voiceLimit) {
        audioData = await generateSpeech(contentBundle.videoScript.substring(0, 1000), selectedVoice);
      }

      const imageData = await imagePromise;
      
      setAudioBase64(audioData || null);
      setImageBase64(imageData || null);

      const newItem: HistoryItem = {
        timestamp: Date.now(),
        prompt,
        platform,
        result: contentBundle,
        imageBase64: imageData || null,
        audioBase64: audioData || null,
        voiceName: selectedVoice,
        videoUrl: null
      };
      
      await push(ref(db, `users/${user.uid}/history`), newItem);
      
      const today = new Date().toISOString().split('T')[0];
      await set(ref(db, `users/${user.uid}/usage/${today}`), {
        posts: dailyUsage + 1,
        voices: audioData ? voiceUsage + 1 : voiceUsage
      });

    } catch (error) {
      console.error(error);
      alert("Error generating pack.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!result?.videoPrompt || !user) return;
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }
    setVideoLoading(true);
    try {
      const url = await generateAIVideo(result.videoPrompt, setVideoStatus);
      setVideoUrl(url);
    } catch (err) {
      console.error(err);
      alert("Video generation failed.");
    } finally {
      setVideoLoading(false);
      setVideoStatus('');
    }
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const playAudio = async () => {
    if (!audioBase64 || !audioContextRef.current) return;
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
      source.start();
    } catch (err) {
      console.error("Playback failed", err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center px-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[65%]">
          {platforms.map(p => (
            <button key={p} onClick={() => setPlatform(p)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase border transition-all ${platform === p ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>{p}</button>
          ))}
        </div>
        <div className="text-right flex items-center gap-3">
          <div>
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Posts</p>
            <p className="text-[10px] font-black text-white">{dailyUsage}/{postLimit}</p>
          </div>
          <div>
            <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest">Voices</p>
            <p className="text-[10px] font-black text-blue-400">{voiceUsage}/{voiceLimit}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-3xl rounded-[2.5rem] p-6 border border-slate-800 shadow-2xl space-y-5">
        <textarea
          className="w-full bg-slate-950/80 border border-slate-800 rounded-3xl px-5 py-4 text-sm text-slate-200 outline-none min-h-[140px] placeholder:text-slate-800 focus:border-blue-600 transition-all"
          placeholder="What's your vision today? (Story, Branding, or Script)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        {voiceLimit > 0 && (
          <div className="space-y-2">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] ml-2">Select Narration Voice</p>
            <select 
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs text-slate-300 outline-none shadow-inner"
            >
              {voices.map(v => <option key={v.id} value={v.name}>{v.label}</option>)}
            </select>
          </div>
        )}

        <button
          onClick={handleGeneratePerfectPack}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-5 rounded-3xl font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? <i className="fas fa-sync animate-spin mr-2"></i> : null}
          {loading ? 'Processing...' : 'Generate Perfect Pack'}
        </button>
      </div>

      {result && (
        <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
          <div className="px-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[8px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest">{result.mode}</span>
              <span className="text-[8px] font-black bg-slate-800 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">{result.detectedLanguage}</span>
            </div>
            <h3 className="text-2xl font-black text-white italic tracking-tight leading-tight">"{result.title}"</h3>
          </div>

          <div className="bg-slate-900/40 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl p-4">
             {imageBase64 ? (
               <img src={`data:image/png;base64,${imageBase64}`} className="w-full rounded-[1.8rem] aspect-square object-cover shadow-lg" alt="AI Generated" />
             ) : (
               <div className="aspect-square bg-slate-950 rounded-[1.8rem] flex flex-col items-center justify-center text-slate-800 space-y-4">
                 <i className="fas fa-magic text-3xl animate-pulse"></i>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em]">Rendering Visual...</p>
               </div>
             )}
          </div>

          <div className="bg-slate-900/40 p-7 rounded-[2.5rem] border border-slate-800 space-y-8 shadow-inner">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl">
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-4">AI Ghostwriter Script</p>
              <p className="text-sm text-slate-400 italic mb-6 whitespace-pre-wrap leading-relaxed">{result.videoScript}</p>
              {audioBase64 ? (
                <button onClick={playAudio} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/10">
                  <i className="fas fa-play"></i> Listen to AI Voice
                </button>
              ) : voiceLimit === 0 ? (
                <div className="bg-slate-900 py-4 rounded-2xl text-center text-slate-600 text-[8px] font-black uppercase border border-slate-800/50">Voice Disabled in Free Plan</div>
              ) : voiceUsage >= voiceLimit ? (
                <div className="bg-slate-900 py-4 rounded-2xl text-center text-amber-500 text-[8px] font-black uppercase border border-amber-500/10">Voice Limit Reached for Today</div>
              ) : (
                <div className="text-center text-[10px] animate-pulse text-slate-700 font-black uppercase">Voice Synthesizing...</div>
              )}
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-900 shadow-xl">
              <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mb-4">Cinematic Video Tool</p>
              {videoUrl ? (
                <video src={videoUrl} controls className="w-full rounded-2xl shadow-lg" />
              ) : videoLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-[9px] font-black text-indigo-400 animate-pulse uppercase tracking-widest">{videoStatus}</p>
                </div>
              ) : (
                <button onClick={handleGenerateVideo} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/10 transition-all active:scale-95">
                  <i className="fas fa-clapperboard"></i> Generate Cinematic AI Video
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-10 space-y-6">
          <div className="px-4">
            <h3 className="text-lg font-black text-white italic">Cloud Sync History</h3>
            <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">Cross-device persistence</p>
          </div>
          <div className="space-y-4 px-2">
            {history.map((item) => (
              <div key={item.id} onClick={() => {
                setPrompt(item.prompt);
                setPlatform(item.platform);
                setResult(item.result);
                setImageBase64(item.imageBase64);
                setAudioBase64(item.audioBase64);
                setVideoUrl(item.videoUrl || null);
                if (item.voiceName) setSelectedVoice(item.voiceName);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} className="bg-slate-900/30 backdrop-blur-md p-4 rounded-[2.2rem] border border-slate-800 flex items-center gap-4 hover:border-slate-700 cursor-pointer group transition-all">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 overflow-hidden shrink-0 border border-slate-800 group-hover:border-blue-500/50 transition-colors">
                  {item.imageBase64 && <img src={`data:image/png;base64,${item.imageBase64}`} className="w-full h-full object-cover" alt="prev" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[7px] font-black text-blue-500 uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{item.result.detectedLanguage}</span>
                    <span className="text-[7px] font-black text-slate-500 uppercase">{item.platform}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-white">{item.prompt}</h4>
                </div>
                <i className="fas fa-chevron-right text-slate-700 group-hover:text-blue-500 transition-colors pr-2"></i>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentEngine;
