import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { Quiz, QuizFormData, Question, QuestionFormData, QuizResult, FilterParams, Host, HostFormData } from '@/types';
import FirebaseService from '@/firebase';
import { BUILTIN_HOST } from '@/constants/auth';
import { authStore } from './AuthStore';

export class DataStore {
  quizzes: Quiz[] = []; questions: Question[] = []; results: QuizResult[] = []; hosts: Host[] = [];
  quizzesLoading = false; questionsLoading = false; resultsLoading = false; hostsLoading = false;
  error: string | null = null; filters: FilterParams = {};

  constructor() { makeAutoObservable(this, {}, { autoBind: true }); }

  get activeQuizzes(): Quiz[] { return this.quizzes.filter(q => q.isActive).sort((a, b) => a.title.localeCompare(b.title, 'ru')); }
  get activeQuestions(): Question[] { return this.questions.filter(q => q.isActive); }
  get activeResults(): QuizResult[] { return this.results.filter(r => r.isActive).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()); }
  
  get filteredQuizzes(): Quiz[] {
    let r = this.activeQuizzes;
    if (this.filters.status) r = r.filter(q => q.status === this.filters.status);
    if (this.filters.search) { const s = this.filters.search.toLowerCase(); r = r.filter(q => q.title.toLowerCase().includes(s)); }
    return r;
  }

  get filteredResults(): QuizResult[] {
    let r = this.activeResults;
    if (this.filters.quizId) r = r.filter(res => res.quizId === this.filters.quizId);
    return r;
  }

  get totalParticipants(): number { return this.activeResults.length; }
  get averageScore(): number { return this.activeResults.length ? Math.round(this.activeResults.reduce((s, r) => s + r.percentage, 0) / this.activeResults.length) : 0; }

  getQuizById = (id: string): Quiz | undefined => this.quizzes.find(q => q.id === id);
  getQuestionsForQuiz = (quizId: string): Question[] => this.activeQuestions.filter(q => q.quizId === quizId);

  get activeHosts(): Host[] { return this.hosts.filter(h => h.isActive).sort((a, b) => a.name.localeCompare(b.name, 'ru')); }

  get allHosts(): Host[] {
    const builtin: Host = {
      id: BUILTIN_HOST.id,
      name: BUILTIN_HOST.name,
      email: BUILTIN_HOST.email,
      password: BUILTIN_HOST.password,
      isActive: true,
      isBuiltIn: true,
      createdAt: '',
    };
    const dynamic = this.activeHosts.filter(h => h.email.toLowerCase() !== BUILTIN_HOST.email);
    return [builtin, ...dynamic];
  }

  loadAllData = async (): Promise<void> => { await Promise.all([this.loadQuizzes(), this.loadQuestions(), this.loadResults(), this.loadHosts()]); };

  loadQuizzes = async (): Promise<void> => { this.quizzesLoading = true; try { const d = await FirebaseService.getData<Record<string, Quiz>>('quizzes'); runInAction(() => { this.quizzes = d ? Object.values(d) : []; this.quizzesLoading = false; }); } catch { runInAction(() => { this.error = 'Ошибка загрузки викторин'; this.quizzesLoading = false; }); } };
  loadQuestions = async (): Promise<void> => { this.questionsLoading = true; try { const d = await FirebaseService.getData<Record<string, Question>>('questions'); runInAction(() => { this.questions = d ? Object.values(d) : []; this.questionsLoading = false; }); } catch { runInAction(() => { this.error = 'Ошибка загрузки вопросов'; this.questionsLoading = false; }); } };
  loadResults = async (): Promise<void> => { this.resultsLoading = true; try { const d = await FirebaseService.getData<Record<string, QuizResult>>('results'); runInAction(() => { this.results = d ? Object.values(d) : []; this.resultsLoading = false; }); } catch { runInAction(() => { this.error = 'Ошибка загрузки результатов'; this.resultsLoading = false; }); } };
  loadHosts = async (): Promise<void> => { this.hostsLoading = true; try { const d = await FirebaseService.getData<Record<string, Host>>('hosts'); runInAction(() => { this.hosts = d ? Object.values(d) : []; this.hostsLoading = false; }); } catch { runInAction(() => { this.error = 'Ошибка загрузки ведущих'; this.hostsLoading = false; }); } };

  findHostByEmail = (email: string): Host | undefined => {
    const normalized = email.trim().toLowerCase();
    return this.activeHosts.find(h => h.email.toLowerCase() === normalized);
  };

  createHost = async (data: HostFormData): Promise<Host | null> => {
    if (!authStore.isAdmin) return null;
    const normalizedEmail = data.email.trim().toLowerCase();
    if (normalizedEmail === BUILTIN_HOST.email || this.findHostByEmail(data.email)) return null;
    const now = new Date().toISOString();
    const host: Host = { id: uuidv4(), ...data, email: data.email.trim().toLowerCase(), isActive: true, createdAt: now };
    try {
      await FirebaseService.setData(`hosts/${host.id}`, host);
      runInAction(() => { this.hosts.push(host); });
      return host;
    } catch { return null; }
  };

  deleteHost = async (id: string): Promise<boolean> => {
    if (!authStore.isAdmin || id === BUILTIN_HOST.id) return false;
    const i = this.hosts.findIndex(h => h.id === id);
    if (i === -1) return false;
    try {
      await FirebaseService.updateData(`hosts/${id}`, { isActive: false });
      runInAction(() => { this.hosts[i].isActive = false; });
      return true;
    } catch { return false; }
  };

  createQuiz = async (data: QuizFormData): Promise<Quiz | null> => { if (!authStore.canCreateQuizzes()) return null; const now = new Date().toISOString(); const q: Quiz = { id: uuidv4(), ...data, questionsCount: 0, status: 'draft', isActive: true, createdAt: now, updatedAt: now }; try { await FirebaseService.setData(`quizzes/${q.id}`, q); runInAction(() => { this.quizzes.push(q); }); return q; } catch { return null; } };
  updateQuiz = async (id: string, data: Partial<QuizFormData>): Promise<boolean> => { if (!authStore.canManageQuizzes()) return false; const i = this.quizzes.findIndex(q => q.id === id); if (i === -1) return false; const u = { ...this.quizzes[i], ...data, updatedAt: new Date().toISOString() }; try { await FirebaseService.setData(`quizzes/${id}`, u); runInAction(() => { this.quizzes[i] = u; }); return true; } catch { return false; } };
  deleteQuiz = async (id: string): Promise<boolean> => { if (!authStore.canManageQuizzes()) return false; const i = this.quizzes.findIndex(q => q.id === id); if (i === -1) return false; try { await FirebaseService.updateData(`quizzes/${id}`, { isActive: false }); runInAction(() => { this.quizzes[i].isActive = false; }); return true; } catch { return false; } };

  createQuestion = async (data: QuestionFormData): Promise<Question | null> => { if (!authStore.canManageQuizzes()) return null; const now = new Date().toISOString(); const q: Question = { id: uuidv4(), ...data, isActive: true, createdAt: now }; try { await FirebaseService.setData(`questions/${q.id}`, q); runInAction(() => { this.questions.push(q); const qi = this.quizzes.findIndex(qu => qu.id === data.quizId); if (qi !== -1) this.quizzes[qi].questionsCount++; }); return q; } catch { return null; } };
  deleteQuestion = async (id: string): Promise<boolean> => { if (!authStore.canManageQuizzes()) return false; const i = this.questions.findIndex(q => q.id === id); if (i === -1) return false; try { await FirebaseService.updateData(`questions/${id}`, { isActive: false }); runInAction(() => { this.questions[i].isActive = false; }); return true; } catch { return false; } };

  changeQuizStatus = async (id: string, status: 'draft' | 'active' | 'completed'): Promise<boolean> => {
    if (!authStore.isAdmin) return false;
    const i = this.quizzes.findIndex(q => q.id === id);
    if (i === -1) return false;
    const now = new Date().toISOString();
    try {
      await FirebaseService.updateData(`quizzes/${id}`, { status, updatedAt: now });
      runInAction(() => { this.quizzes[i].status = status; this.quizzes[i].updatedAt = now; });
      return true;
    } catch { return false; }
  };

  saveQuestionsForQuiz = async (quizId: string, questionsData: QuestionFormData[]): Promise<boolean> => {
    if (!authStore.canManageQuizzes()) return false;
    try {
      // Deactivate existing questions for this quiz
      const existing = this.questions.filter(q => q.quizId === quizId && q.isActive);
      for (const q of existing) {
        await FirebaseService.updateData(`questions/${q.id}`, { isActive: false });
        runInAction(() => { const idx = this.questions.findIndex(x => x.id === q.id); if (idx !== -1) this.questions[idx].isActive = false; });
      }
      // Create new questions
      const now = new Date().toISOString();
      for (const data of questionsData) {
        const q: Question = { id: uuidv4(), ...data, quizId, isActive: true, createdAt: now };
        await FirebaseService.setData(`questions/${q.id}`, q);
        runInAction(() => { this.questions.push(q); });
      }
      // Update questionsCount on the quiz
      const qi = this.quizzes.findIndex(q => q.id === quizId);
      if (qi !== -1) {
        const count = questionsData.length;
        await FirebaseService.updateData(`quizzes/${quizId}`, { questionsCount: count, updatedAt: now });
        runInAction(() => { this.quizzes[qi].questionsCount = count; this.quizzes[qi].updatedAt = now; });
      }
      return true;
    } catch { return false; }
  };

  submitResult = async (result: Omit<QuizResult, 'id' | 'isActive'>): Promise<QuizResult | null> => { const r: QuizResult = { id: uuidv4(), ...result, isActive: true }; try { await FirebaseService.setData(`results/${r.id}`, r); runInAction(() => { this.results.push(r); }); return r; } catch { return null; } };

  setFilter = (key: keyof FilterParams, value: string | undefined): void => { this.filters = { ...this.filters, [key]: value }; };
  clearFilters = (): void => { this.filters = {}; };
  clearError = (): void => { this.error = null; };
}

export const dataStore = new DataStore();
