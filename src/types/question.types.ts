export interface QuestionOption { id: string; text: string; isCorrect: boolean; }
export interface Question { id: string; quizId: string; text: string; options: QuestionOption[]; points: number; timeLimit?: number; isActive: boolean; createdAt: string; }
export interface QuestionFormData { quizId: string; text: string; options: QuestionOption[]; points: number; timeLimit?: number; }
