export enum Subject {
  MATEMATICA = 'Matemática',
  PORTUGUES = 'Português',
  CIENCIAS = 'Ciências',
  HISTORIA = 'História',
  GEOGRAFIA = 'Geografia'
}
export interface Exercise { id: string; title: string; url: string; completed: boolean; }
export interface Student { id: string; name: string; password: string; avatar: string; xp: number; exercises: Record<string, Exercise[]>; }