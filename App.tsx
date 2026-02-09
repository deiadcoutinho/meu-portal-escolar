import React, { useState, useEffect } from 'react';
import { 
  Trophy, LayoutDashboard, BookOpen, Medal, LogOut, 
  CheckCircle2, Settings, Sparkles, Loader2, PlusCircle, GraduationCap, ExternalLink
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { MOCK_STUDENTS } from './mockData';
import { Subject, Student } from './types';

const STORAGE_KEY = 'edurank_v1_final';

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_STUDENTS;
  });
  
  const [user, setUser] = useState<Student | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ name: '', pass: '' });
  const [error, setError] = useState('');
  const [selectedSub, setSelectedSub] = useState<string>(Subject.MATEMATICA);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMission, setAiMission] = useState<{ title: string; text: string } | null>(null);

  const [targetStudentId, setTargetStudentId] = useState('');
  const [newEx, setNewEx] = useState({ title: '', url: '' });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    if (students.length > 0 && !targetStudentId) {
      setTargetStudentId(students[0].id);
    }
  }, [students]);

  const handleLogout = () => {
    setUser(null); setIsAdmin(false); setActiveTab('dashboard');
    setLoginForm({ name: '', pass: '' }); setError('');
    setAiMission(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const nameInput = loginForm.name.trim().toLowerCase();
    const passInput = loginForm.pass.trim();

    if (nameInput === 'admin' && passInput === 'admin') {
      setIsAdmin(true); setActiveTab('admin'); setError('');
      return;
    }
    
    const found = students.find(s => s.name.toLowerCase() === nameInput && s.password === passInput);
    if (found) {
      setUser(found); setActiveTab('dashboard'); setError('');
    } else {
      setError('Acesso negado.');
    }
  };

  const getAiMission = async () => {
    if (!user) return;
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Crie uma missão de estudo motivadora para o aluno ${user.name}. Seja breve e encorajador.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              text: { type: Type.STRING },
            },
            required: ["title", "text"],
          },
        },
      });
      if (response.text) {
        setAiMission(JSON.parse(response.text));
      }
    } catch (e) {
      setAiMission({ title: "Foco Total", text: "Complete seus exercícios hoje para ganhar XP extra!" });
    } finally {
      setAiLoading(false);
    }
  };

  const toggleEx = (sub: string, exId: string) => {
    const updatedStudents = students.map(s => {
      if (user && s.id === user.id) {
        const subExercises = s.exercises[sub] || [];
        const exercise = subExercises.find(e => e.id === exId);
        if (!exercise) return s;
        const isCompleted = !exercise.completed;
        const newExercises = { 
          ...s.exercises, 
          [sub]: subExercises.map(ex => ex.id === exId ? { ...ex, completed: isCompleted } : ex) 
        };
        return { ...s, exercises: newExercises, xp: s.xp + (isCompleted ? 50 : -50) };
      }
      return s;
    });
    setStudents(updatedStudents);
    if (user) {
      const updatedUser = updatedStudents.find(s => s.id === user.id);
      if (updatedUser) setUser(updatedUser);
    }
  };

  const calculateTotalProgress = (student: Student) => {
    const all = Object.values(student.exercises).flat();
    return all.length === 0 ? 0 : (all.filter(e => e.completed).length / all.length) * 100;
  };

  if (!user && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[3rem] p-12 w-full max-w-md text-center shadow-2xl">
          <GraduationCap size={60} className="mx-auto text-indigo-500 mb-6" />
          <h1 className="text-4xl font-black text-white mb-8 italic uppercase tracking-tighter">EduRank</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Nome" value={loginForm.name} onChange={e => setLoginForm({...loginForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all" />
            <input type="password" placeholder="Senha" value={loginForm.pass} onChange={e => setLoginForm({...loginForm, pass: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 transition-all" />
            {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl">Entrar</button>
          </form>
          <button onClick={() => { setLoginForm({name: 'admin', pass: 'admin'}); }} className="mt-8 text-white/20 text-[10px] font-black uppercase hover:text-white transition-colors">Acesso Professor (admin/admin)</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
      <aside className="lg:w-80 bg-white border-r p-8 flex flex-col h-screen sticky top-0 shadow-sm">
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-indigo-600 p-2 rounded-lg text-white"><GraduationCap size={20} /></div>
          <span className="text-2xl font-black italic tracking-tighter uppercase">EduRank</span>
        </div>
        <nav className="flex-1 space-y-3 font-black uppercase text-[11px] tracking-widest text-slate-400">
          {isAdmin ? (
            <>
              <button onClick={() => setActiveTab('admin')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50'}`}><Settings size={18}/> Gestão</button>
              <button onClick={() => setActiveTab('ranking')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'ranking' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50'}`}><Medal size={18}/> Ranking</button>
            </>
          ) : (
            <>
              <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50'}`}><LayoutDashboard size={18}/> Início</button>
              <button onClick={() => setActiveTab('subjects')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'subjects' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50'}`}><BookOpen size={18}/> Matérias</button>
              <button onClick={() => setActiveTab('ranking')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'ranking' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50'}`}><Trophy size={18}/> Ranking</button>
            </>
          )}
        </nav>
        <button onClick={handleLogout} className="mt-8 flex items-center gap-3 text-[11px] font-black uppercase text-rose-500 p-4 hover:bg-rose-50 rounded-2xl transition-all">Sair</button>
      </aside>

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
        {activeTab === 'admin' && isAdmin && (
          <div className="max-w-5xl space-y-10 animate-slide">
            <h2 className="text-4xl font-black italic tracking-tight">Painel do Professor</h2>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                <h3 className="text-xl font-black flex items-center gap-2"><PlusCircle className="text-indigo-600"/> Nova Atividade</h3>
                <div className="space-y-4 pt-4">
                  <label className="block text-[10px] font-black uppercase text-slate-400">Para o Aluno:</label>
                  <select value={targetStudentId} onChange={e => setTargetStudentId(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-xl font-bold">
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <label className="block text-[10px] font-black uppercase text-slate-400">Matéria:</label>
                  <select value={selectedSub} onChange={e => setSelectedSub(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-xl font-bold">
                    {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="text" placeholder="Nome da Atividade" value={newEx.title} onChange={e => setNewEx({...newEx, title: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-xl font-bold" />
                  <input type="text" placeholder="Link (ex: Google Docs, Kahoot)" value={newEx.url} onChange={e => setNewEx({...newEx, url: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-xl font-bold" />
                  <button onClick={() => {
                    if(!newEx.title || !newEx.url) return;
                    const updated = students.map(s => {
                      if (s.id === targetStudentId) {
                        const ex = { id: Math.random().toString(), title: newEx.title, url: newEx.url, completed: false };
                        return { ...s, exercises: { ...s.exercises, [selectedSub]: [...(s.exercises[selectedSub] || []), ex] } };
                      }
                      return s;
                    });
                    setStudents(updated);
                    setNewEx({ title: '', url: '' });
                    alert("Atividade enviada!");
                  }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">Enviar para Aluno</button>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                <h3 className="text-xl font-black mb-6">Status dos Alunos</h3>
                <div className="space-y-3">
                  {students.map(s => (
                    <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <img src={s.avatar} className="w-8 h-8 rounded-full bg-indigo-100" />
                        <span className="font-black text-sm">{s.name}</span>
                      </div>
                      <span className="text-indigo-600 font-black text-xs">{calculateTotalProgress(s).toFixed(0)}% concluído</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && user && (
          <div className="max-w-4xl space-y-10 animate-slide">
             <div className="flex items-center justify-between bg-white p-8 rounded-[3rem] border shadow-sm">
                <div className="flex items-center gap-6">
                   <img src={user.avatar} className="w-24 h-24 rounded-[2rem] bg-indigo-50 border-4 border-white shadow-lg" />
                   <div>
                      <h2 className="text-3xl font-black italic tracking-tight uppercase">Oi, {user.name.split(' ')[0]}!</h2>
                      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{user.xp} XP acumulados</p>
                   </div>
                </div>
                <button onClick={getAiMission} disabled={aiLoading} className="bg-indigo-600 text-white p-6 rounded-[2rem] flex items-center gap-4 shadow-xl hover:bg-indigo-500 transition-all group">
                  {aiLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  <span className="font-black uppercase text-xs">Missão AI</span>
                </button>
             </div>
             {aiMission && (
               <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 animate-slide">
                 <h3 className="text-indigo-600 font-black uppercase text-xs mb-2">✨ {aiMission.title}</h3>
                 <p className="font-bold text-slate-700 leading-relaxed">{aiMission.text}</p>
               </div>
             )}
             <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
                <h3 className="font-black uppercase text-xs text-slate-400 mb-6">Seu Progresso Geral</h3>
                <div className="flex items-end gap-2 mb-6">
                   <span className="text-7xl font-black italic leading-none">{calculateTotalProgress(user).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                   <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${calculateTotalProgress(user)}%` }}></div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'subjects' && user && (
          <div className="max-w-4xl space-y-8 animate-slide">
             <h2 className="text-4xl font-black italic tracking-tight">Minhas Matérias</h2>
             <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {Object.values(Subject).map(sub => (
                  <button key={sub} onClick={() => setSelectedSub(sub)} className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all ${selectedSub === sub ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border text-slate-400 hover:bg-slate-50'}`}>{sub}</button>
                ))}
             </div>
             <div className="grid gap-4">
                {(user.exercises[selectedSub] || []).length === 0 ? (
                  <div className="text-center p-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold italic">Nenhuma atividade postada para esta matéria ainda.</p>
                  </div>
                ) : (user.exercises[selectedSub] || []).map(ex => (
                  <div key={ex.id} className={`bg-white p-8 rounded-[2.5rem] border flex items-center justify-between transition-all ${ex.completed ? 'opacity-50' : 'hover:shadow-xl hover:border-indigo-100'}`}>
                    <div className="flex items-center gap-8">
                       <button onClick={() => toggleEx(selectedSub, ex.id)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${ex.completed ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300 hover:bg-indigo-50 hover:text-indigo-400'}`}><CheckCircle2 size={32} /></button>
                       <div>
                          <h4 className={`font-black text-xl ${ex.completed ? 'line-through' : ''}`}>{ex.title}</h4>
                          <span className="text-[10px] font-black uppercase text-indigo-400">{ex.completed ? 'Atividade Concluída' : 'Pendente (+50 XP)'}</span>
                       </div>
                    </div>
                    {!ex.completed && <a href={ex.url} target="_blank" rel="noreferrer" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2">Abrir Link <ExternalLink size={14}/></a>}
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="max-w-4xl space-y-10 animate-slide">
             <h2 className="text-4xl font-black italic tracking-tight">Quadro de Honra</h2>
             <div className="bg-white rounded-[3rem] border shadow-sm divide-y overflow-hidden">
                {[...students].sort((a,b) => b.xp - a.xp).map((s, idx) => (
                  <div key={s.id} className={`p-8 flex items-center justify-between transition-all ${user?.id === s.id ? 'bg-indigo-50/30' : ''}`}>
                     <div className="flex items-center gap-6">
                        <span className={`text-3xl font-black italic w-12 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-600' : 'text-slate-200'}`}>#{idx + 1}</span>
                        <img src={s.avatar} className="w-14 h-14 rounded-2xl bg-indigo-50" />
                        <span className="font-black text-xl">{s.name} {user?.id === s.id && <span className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded ml-2">VOCÊ</span>}</span>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="text-3xl font-black italic tabular-nums">{s.xp}</span>
                        <span className="text-slate-300 font-bold text-xs">XP</span>
                        <Trophy size={20} className={idx === 0 ? 'text-yellow-400' : 'hidden'} />
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default App;