
import React, { useState, useEffect } from 'react';
import { auth, db } from '../services/firebaseService';
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { ref, update, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const Profile: React.FC<{ profile: any }> = ({ profile }) => {
  const [name, setName] = useState(profile?.name || '');
  const [updating, setUpdating] = useState(false);
  const [usage, setUsage] = useState({ posts: 0, voices: 0 });
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const usageRef = ref(db, `users/${user.uid}/usage/${today}`);
    
    onValue(usageRef, (snap) => {
      const data = snap.val();
      if (data) {
        setUsage({
          posts: data.posts || 0,
          voices: data.voices || 0
        });
      }
    });

    if (profile?.name) setName(profile.name);
  }, [user, profile]);

  const handleUpdate = async () => {
    if (!user || !name.trim()) return;
    setUpdating(true);
    try {
      await update(ref(db, `users/${user.uid}/profile`), {
        name: name
      });
      alert("Profile updated successfully!");
    } catch (e) {
      alert("Error updating profile.");
    } finally {
      setUpdating(false);
    }
  };

  const getInitials = (email: string) => {
    return email?.substring(0, 2).toUpperCase() || 'BF';
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-blue-500/30">
          {getInitials(user?.email || '')}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white italic tracking-tight">{profile?.name || 'Partner Account'}</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{user?.email}</p>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Active Plan</h3>
          <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-amber-500/20">
            {profile?.status || 'Free'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950/50 p-4 rounded-3xl border border-slate-800">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Posts (Today)</p>
            <p className="text-xl font-black text-white">{usage.posts}</p>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-3xl border border-slate-800">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Voices (Today)</p>
            <p className="text-xl font-black text-blue-400">{usage.voices}</p>
          </div>
        </div>

        {profile?.expiryDate && (
          <p className="text-[9px] text-slate-500 font-bold mt-6 text-center uppercase tracking-widest">
            Renewal Date: <span className="text-slate-300">{new Date(profile.expiryDate).toLocaleDateString()}</span>
          </p>
        )}
      </div>

      {/* Settings Form */}
      <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-800 shadow-2xl space-y-6">
        <div className="space-y-1.5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Display Name</p>
          <input 
            type="text" 
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-blue-500 transition-all shadow-inner"
            placeholder="Your Business Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button 
          onClick={handleUpdate}
          disabled={updating}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-[1.5rem] font-black transition-all active:scale-95 shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {updating ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-save"></i>}
          Save Changes
        </button>

        <div className="pt-4 border-t border-slate-800/50">
          <button 
            onClick={() => signOut(auth)}
            className="w-full bg-slate-950 text-slate-500 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest border border-slate-800 hover:text-rose-500 hover:border-rose-500/20 transition-all active:scale-95"
          >
            Sign Out Partner Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
