import React, { useState, useEffect } from 'react';
import {
  Settings,
  GraduationCap,
  UserPlus,
  BookOpen
} from 'lucide-react';
import { MOCK_STUDENTS } from './mockData';
import { Subject, Student } from './types';

const STORAGE_KEY = 'edurank_v1_final';

type AssignedSubject = {
  subject: Subject;
  link: string;
};

const App: React.FC = () => {
  const [students, setStudents] = useState<(Student & { assignedSubjects?: AssignedSubject[] })[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_STUDENTS.map(s => ({ ...s, assignedSubjects: [] }));
  });

  const [user, setUser] = useState<Student | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'admin'>('admin');

  const [loginForm, setLoginForm] = useState({ name: '', pass: '' });
  const [error, setError] = useState('');

  const [newStudent, setNewStudent] = useState({ name: '', password: '' });

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MATEMATICA);
  const [subjectLink, setSubjectLink] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (loginForm.name === 'admin' && loginForm.pass === 'admin') {
      setIsAdmin(true);
      return;
    }

    setError('Acesso negado');
  };

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.password) return;

    const aluno: Student & { assignedSubjects: AssignedSubject[] } = {
      id: crypto.randomUUID(),
      name: newStudent.name,
      password: newStudent.password,
      xp: 0,
      avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${newStudent.name}`,
      exercises: {},
      assignedSubjects: []
    };

    setStudents(prev => [...prev, aluno]);
    setNewStudent({ name: '', password: '' });
  };

  const assignSubject = () => {
    if (!selectedStudentId || !subjectLink) return;

    setStudents(prev =>
      prev.map(s => {
        if (s.id !== selectedStudentId) return s;

        const exists = s.assignedSubjects?.find(a => a.subject === selectedSubject);

        if (exists) {
          return {
            ...s,
            assignedSubjects: s.assignedSubjects!.map(a =>
              a.subject === selectedSubject ? { ...a, link: subjectLink } : a
            )
          };
        }

        return {
          ...s,
          assignedSubjects: [...(s.assignedSubjects || []), { subject: selectedSubject, link: subjectLink }]
        };
      })
    );

    setSubjectLink('');
    alert('Matéria atribuída!');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-3xl space-y-4">
          <h1 className="text-2xl font-black">EduRank</h1>
          <input
            placeholder="Usuário"
            value={loginForm.name}
            onChange={e => setLoginForm({ ...loginForm, name: e.target.value })}
            className="border p-3 rounded-xl w-full"
          />
          <input
            type="password"
            placeholder="Senha"
            value={loginForm.pass}
            onChange={e => setLoginForm({ ...loginForm, pass: e.target.value })}
            className="border p-3 rounded-xl w-full"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button className="bg-indigo-600 text-white w-full py-3 rounded-xl font-black">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-72 bg-white border-r p-6">
        <h2 className="font-black text-xl flex items-center gap-2">
          <GraduationCap /> Professor
        </h2>
      </aside>

      <main className="flex-1 p-10 space-y-10">
        <h1 className="text-4xl font-black">Painel do Professor</h1>

        {/* CADASTRO DE ALUNO */}
        <div className="bg-white p-8 rounded-3xl border space-y-4 max-w-xl">
          <h3 className="font-black flex items-center gap-2">
            <UserPlus /> Novo Aluno
          </h3>
          <input
            placeholder="Nome"
            value={newStudent.name}
            onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
            className="border p-3 rounded-xl w-full"
          />
          <input
            placeholder="Senha"
            value={newStudent.password}
            onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
            className="border p-3 rounded-xl w-full"
          />
          <button onClick={handleAddStudent} className="bg-indigo-600 text-white py-3 rounded-xl font-black w-full">
            Cadastrar
          </button>
        </div>

        {/* ATRIBUIÇÃO DE MATÉRIA */}
        <div className="bg-white p-8 rounded-3xl border space-y-4 max-w-xl">
          <h3 className="font-black flex items-center gap-2">
            <BookOpen /> Atribuir Matéria
          </h3>

          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            className="border p-3 rounded-xl w-full"
          >
            <option value="">Selecione o aluno</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value as Subject)}
            className="border p-3 rounded-xl w-full"
          >
            {Object.values(Subject).map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          <input
            placeholder="Link da matéria / jogo"
            value={subjectLink}
            onChange={e => setSubjectLink(e.target.value)}
            className="border p-3 rounded-xl w-full"
          />

          <button onClick={assignSubject} className="bg-slate-900 text-white py-3 rounded-xl font-black w-full">
            Atribuir
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
