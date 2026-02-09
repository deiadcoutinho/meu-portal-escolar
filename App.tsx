import React, { useState, useEffect } from 'react';
import {
  Trophy, LayoutDashboard, BookOpen, Medal, LogOut,
  CheckCircle2, Settings, Sparkles, Loader2, PlusCircle,
  GraduationCap, ExternalLink, UserPlus
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

  const [newStudent, setNewStudent] = useState({ name: '', password: '' });

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
    setUser(null);
    setIsAdmin(false);
    setActiveTab('dashboard');
    setLoginForm({ name: '', pass: '' });
    setError('');
    setAiMission(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const nameInput = loginForm.name.trim().toLowerCase();
    const passInput = loginForm.pass.trim();

    if (nameInput === 'admin' && passInput === 'admin') {
      setIsAdmin(true);
      setActiveTab('admin');
      setError('');
      return;
    }

    const found = students.find(
      s => s.name.toLowerCase() === nameInput && s.password === passInput
    );

    if (found) {
      setUser(found);
      setActiveTab('dashboard');
      setError('');
    } else {
      setError('Acesso negado.');
    }
  };

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.password) {
      alert("Preencha nome e senha do aluno");
      return;
    }

    const exists = students.some(
      s => s.name.toLowerCase() === newStudent.name.toLowerCase()
    );

    if (exists) {
      alert("Já existe um aluno com esse nome");
      return;
    }

    const aluno: Student = {
      id: crypto.randomUUID(),
      name: newStudent.name,
      password: newStudent.password,
      xp: 0,
      avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${newStudent.name}`,
      exercises: {}
    };

    setStudents(prev => [...prev, aluno]);
    setNewStudent({ name: '', password: '' });
    alert("Aluno cadastrado com sucesso!");
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
            <input placeholder="Nome" value={loginForm.name}
              onChange={e => setLoginForm({ ...loginForm, name: e.target.value })}
              className="w-full bg-white/5 border rounded-2xl p-4 text-white" />
            <input type="password" placeholder="Senha" value={loginForm.pass}
              onChange={e => setLoginForm({ ...loginForm, pass: e.target.value })}
              className="w-full bg-white/5 border rounded-2xl p-4 text-white" />
            {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase">Entrar</button>
          </form>
          <button onClick={() => setLoginForm({ name: 'admin', pass: 'admin' })}
            className="mt-8 text-white/30 text-[10px] uppercase">Acesso Professor</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-80 bg-white border-r p-8">
        <button onClick={() => setActiveTab('admin')}
          className="flex items-center gap-3 font-black uppercase text-xs">
          <Settings /> Gestão
        </button>
        <button onClick={handleLogout}
          className="mt-6 text-rose-500 font-black uppercase text-xs">Sair</button>
      </aside>

      <main className="flex-1 p-12">
        {activeTab === 'admin' && isAdmin && (
          <div className="max-w-5xl space-y-8">
            <h2 className="text-4xl font-black">Painel do Professor</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* CADASTRO DE ALUNO */}
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <UserPlus className="text-indigo-600" /> Cadastrar Novo Aluno
                </h3>
                <input
                  placeholder="Nome do aluno"
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full p-4 border rounded-xl font-bold"
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={newStudent.password}
                  onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
                  className="w-full p-4 border rounded-xl font-bold"
                />
                <button
                  onClick={handleAddStudent}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase">
                  Cadastrar Aluno
                </button>
              </div>

              {/* STATUS */}
              <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                <h3 className="text-xl font-black mb-4">Alunos Cadastrados</h3>
                <div className="space-y-3">
                  {students.map(s => (
                    <div key={s.id} className="flex justify-between bg-slate-50 p-4 rounded-xl">
                      <span className="font-black">{s.name}</span>
                      <span className="text-indigo-600 font-black text-xs">
                        {calculateTotalProgress(s).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App; 
