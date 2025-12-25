
import React, { useState, useEffect } from 'react';
import { generatePersonalizedCourse } from '../services/geminiService';
import { db, auth } from '../services/firebaseService';
import { ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const Academy: React.FC = () => {
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [savedCourses, setSavedCourses] = useState<any[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const coursesRef = ref(db, `users/${user.uid}/courses`);
    return onValue(coursesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSavedCourses(Object.values(data).reverse());
    });
  }, [user]);

  const handleGenerateCourse = async () => {
    if (!goal.trim() || !user) return;
    setLoading(true);
    try {
      const data = await generatePersonalizedCourse(goal);
      setCourse(data);
      await push(ref(db, `users/${user.uid}/courses`), {
        ...data,
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
        <h2 className="text-3xl font-black text-white leading-tight tracking-tight">AI Academy</h2>
        <p className="text-slate-400 font-medium">Cloud Learning Portal</p>
      </div>

      <div className="bg-slate-900/50 rounded-[2.5rem] p-7 border border-slate-800 shadow-2xl">
        <h3 className="text-white font-bold mb-6 text-lg">Goal-based learning path</h3>
        <div className="space-y-4">
          <input
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] px-6 py-5 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            placeholder="e.g. Master Social Media Strategy"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <button 
            onClick={handleGenerateCourse}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-5 rounded-[1.5rem] font-black active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            {loading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-graduation-cap"></i>}
            Create & Save Path
          </button>
        </div>
      </div>

      {course && (
        <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-700">
          <div className="bg-gradient-to-br from-emerald-900 to-slate-950 rounded-[2.5rem] p-7 text-white border border-emerald-500/10">
            <h3 className="text-xl font-black mb-3">{course.courseTitle}</h3>
            <p className="text-xs text-emerald-100/70 italic font-medium">{course.hinglishDescription}</p>
          </div>
          <div className="space-y-4">
            {course.modules.map((mod: any, i: number) => (
              <div key={i} className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800 flex items-center gap-5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs border border-emerald-500/20">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{mod.title}</h4>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{mod.estimatedTime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedCourses.length > 0 && !course && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Your Library</h4>
          {savedCourses.slice(0, 3).map((c, i) => (
            <div key={i} className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800">
              <p className="text-white font-bold text-sm">{c.courseTitle}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Academy;
