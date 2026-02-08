export type QuizStatus = 'draft' | 'active' | 'completed';
export interface Quiz { id: string; title: string; description: string; questionsCount: number; timeLimit?: number; status: QuizStatus; isActive: boolean; createdAt: string; updatedAt: string; }
export interface QuizFormData { title: string; description: string; timeLimit?: number; }
