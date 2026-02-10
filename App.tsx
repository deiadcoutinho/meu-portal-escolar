import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { MOCK_STUDENTS } from './mockData';
import { Subject, Student } from './types';

const STORAGE_KEY = 'edurank_v1_final';

type Exercise = {
  id: string;
  title: string;
  points: number;
  done: boolean;
};

const App: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : MOCK_STUDENTS;
  });

  const [user, setUser] = useState<Student | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loginForm, setLoginForm] = useState({ name: '', pass: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

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
    setUser(null);
    setIsAdmin(false);
    setLoginForm({ name: '', pass: '' });
  };

  /* ================= ALUNO ================= */
  if (user && !isAdmin) {
    return (
      <div style={{ padding: 30 }}>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            background: 'red',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: 8,
            marginBottom: 20
          }}
        >
          SAIR
        </button>

        <h1>{user.name} — XP: {user.xp}</h1>

        {(user.exercises?.[Subject.MATEMATICA] || []).map((ex: Exercise) => (
          <div key={ex.id}>
            {ex.title}
            {!ex.done && (
              <button onClick={() => {}}>
                <CheckCircle size={16} /> Concluir
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  /* ================= LOGIN ================= */
  if (!isAdmin) {
    return (
      <form onSubmit={handleLogin} style={{ padding: 40 }}>
        <h1>EduRank</h1>

        <input
          placeholder="Usuário"
          value={loginForm.name}
          onChange={e => setLoginForm({ ...loginForm, name: e.target.value })}
        />
        <br />

        <input
          type="password"
          placeholder="Senha"
          value={loginForm.pass}
          onChange={e => setLoginForm({ ...loginForm, pass: e.target.value })}
        />
        <br />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit">Entrar</button>
      </form>
    );
  }

  /* ================= PROFESSOR ================= */
  return (
    <div style={{ padding: 30 }}>
      <button
        onClick={handleLogout}
        style={{
          padding: '10px 20px',
          background: 'red',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: 8,
          marginBottom: 20
        }}
      >
        SAIR
      </button>

      <h1>Painel do Professor</h1>
      <p>Se você está vendo este botão, o logout está funcionando.</p>
    </div>
  );
};

export default App;
