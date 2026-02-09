import { useState } from "react";

type Aluno = {
  nome: string;
  senha: string;
};

export default function CadastrarAluno() {
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>(() => {
    const saved = localStorage.getItem("alunos");
    return saved ? JSON.parse(saved) : [];
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nome || !senha) {
      alert("Preencha nome e senha do aluno");
      return;
    }

    const novoAluno = { nome, senha };
    const novaLista = [...alunos, novoAluno];

    setAlunos(novaLista);
    localStorage.setItem("alunos", JSON.stringify(novaLista));

    setNome("");
    setSenha("");
    alert("Aluno cadastrado com sucesso!");
  }

  return (
    <div className="max-w-md bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">Cadastrar novo aluno</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nome do aluno"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />

        <input
          type="password"
          placeholder="Senha do aluno"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Cadastrar aluno
        </button>
      </form>
    </div>
  );
}
