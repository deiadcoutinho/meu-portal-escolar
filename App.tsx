import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  UserPlus,
  BookOpen,
  CheckCircle
} from 'lucide-react';
import { MOCK_STUDENTS } from './mockData';
import { Subject, Student } from './types';

const STORAGE_KEY = 'edurank_v1_final';

type AssignedSubject = {
  subject: Subject;
  link: string;
};

type Exercise = {
  id: string;
  title: string;
  points: number;
  done: boolean;
};

const App: React.FC = () => {
  const [students, setStudents] = useState<(Student & {
    assignedSubjects?: AssignedSubject[];
    exercises?: { [key: string]: Exercise[] };
  })[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : MOCK_STUDENTS.map(s => ({
          ...s,
          assignedSubjects: [],
          exercises: {}
        }));
  });

  const [user, setUser] = useState<Student | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loginForm, setLoginForm] = useState({ name: '', pass: '' });
  const [error, setError] = useState('');

  const [newStudent, setNewStudent] = useState({ name: '', password: '' });

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MATEMATICA);
  const [subjectLink, setSubjectLink] = useState('');

  const [exerciseTitle, setExerciseTitle] = useState('');
  const [exercisePoints, setExercisePoints] = useState(10);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  /* =======================
     LOGIN / LOGOUT
  ======================= */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (loginForm.name === 'admin' && loginForm.pass === 'admin') {
      setIsAdmin(true);
      setUser(null);
      setError('');
      return;
    }

    const aluno = students.find(
      s => s.name === loginForm.name && s.password === loginForm.pass
    );

    if (aluno) {
      setUser(aluno);
      setIsAdmin(false);
      setError('');
      return;
    }

    setError('Usuário ou senha inválidos');
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setUser(null);
    setLoginForm({ name: '', pass: '' });
    setError('');
  };

  /* =======================
     PROFESSOR
  ======================= */
  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.password) return;

    setStudents(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: newStudent.name,
        password: newStudent.password,
        xp: 0,
        avatar: '',
        exercises: {},
        assignedSubjects: []
      }
    ]);

    setNewStudent({ name: '', password: '' });
  };

  const assignSubject = () => {
    if (!selectedStudentId || !subjectLink) return;

    setStudents(prev =>
      prev.map(s => {
        if (s.id !== selectedStudentId) return s;

        const exists = s.assignedSubjects?.find(a => a.subject === selectedSubject);

        return {
          ...s,
          assignedSubjects: exists
            ? s.assignedSubjects!.map(a =>
                a.subject === selectedSubject ? { ...a, link: subjectLink } : a
              )
            : [...(s.assignedSubjects || []), { subject: selectedSubject, link: subjectLink }]
        };
      })
    );

    setSubjectLink('');
  };

  const addExercise = () => {
    if (!selectedStudentId || !exerciseTitle) return;

    setStudents(prev =>
      prev.map(s => {
        if (s.id !== selectedStudentId) return s;

        const list = s.exercises?.[selectedSubject] || [];

        return {
          ...s,
          exercises: {
            ...s.exercises,
            [selectedSubject]: [
              ...list,
              {
                id: crypto.randomUUID(),
                title: exerciseTitle,
                points: exercisePoints,
                done: false
              }
            ]
          }
        };
      })
    );

    setExerciseTitle('');
  };

  /* =======================
     ALUNO
  ======================= */
  const completeExercise = (subject: string, exerciseId: string) => {
    if (!user) return;

    setStudents(prev =>
      prev.map(s => {
        if (s.id !== user.id) return s;

        return {
          ...s,
          xp: s.xp + 10,
          exercises: {
            ...s.exercises,
            [subject]: s.exercises![subject].map(ex =>
              ex.id === exerciseId ? { ...ex, done: true } : ex
            )
          }
        };
      })
    );

    setUser(prev =>
      prev
        ? {
            ...prev,
            xp: prev.xp + 10,
            exercises: {
              ...prev.exercises,
              [subject]: prev.exercises![subject].map(ex =>
                ex.id === exerciseId ? { ...ex, done: true } : ex
              )
            }
          }
        : prev
    );
  };

  /* =======================
     TELA DO ALUNO
  ======================= */
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 p-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black">
            {user.name} — XP: {user.xp}
          </h1>

          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold"
          >
            Sair
          </button>
        </div>

        {user.assignedSubjects?.map(sub => (
          <div key={sub.subject} className="bg-white p-6 rounded-3xl border mb-6">
            <h2 className="text-xl font-black mb-4">{sub.subject}</h2>

            {(user.exercises?.[sub.subject] || []).map(ex => (
              <div key={ex.id} className="flex justify-between items-center mb-2">
                <span>
                  {ex.title} ({ex.points} pts)
                </span>

                {!ex.done && (
                  <button
                    onClick={() => completeExercise(sub.subject, ex.id)}
                    className="text-green-600 font-bold flex gap-1"
                  >
                    <CheckCircle size={18} /> Concluir
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  /* =======================
     LOGIN
  ======================= */
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

  /* =======================
     PAINEL DO PROFESSOR
  ======================= */
  return (
    <div className="min-h-screen bg-slate-50 p-10 space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black">Painel do Professor</h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold"
        >
          Sair
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border max-w-xl">
        <h3 className="font-black mb-2">Novo Aluno</h3>
        <input
          placeholder="Nome"
          value={newStudent.name}
          onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
          className="border p-2 rounded-xl w-full mb-2"
        />
        <input
          placeholder="Senha"
          value={newStudent.password}
          onChange={e => setNewStudent({ ...newStudent, password: e.target.value })}
          className="border p-2 rounded-xl w-full mb-2"
        />
        <button
          onClick={handleAddStudent}
          className="bg-indigo-600 text-white py-2 rounded-xl w-full"
        >
          Cadastrar
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border max-w-xl space-y-3">
        <h3 className="font-black">Adicionar Exercício</h3>

        <select
          value={selectedStudentId}
          onChange={e => setSelectedStudentId(e.target.value)}
          className="border p-2 rounded-xl w-full"
        >
          <option value="">Aluno</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value as Subject)}
          className="border p-2 rounded-xl w-full"
        >
          {Object.values(Subject).map(sub => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>

        <input
          placeholder="Título do exercício"
          value={exerciseTitle}
          onChange={e => setExerciseTitle(e.target.value)}
          className="border p-2 rounded-xl w-full"
        />

        <input
          type="number"
          value={exercisePoints}
          onChange={e => setExercisePoints(Number(e.target.value))}
          className="border p-2 rounded-xl w-full"
        />

        <button
          onClick={addExercise}
          className="bg-slate-900 text-white py-2 rounded-xl w-full"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
};

export default App;
