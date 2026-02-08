export type PageId = 'home' | 'quizzes' | 'quiz-taking' | 'results' | 'admin' | 'admin-quizzes' | 'admin-questions';
export interface PageConfig { id: PageId; title: string; icon: string; requiresAuth: boolean; requiredRole?: 'host' | 'admin'; showInNav: boolean; parentId?: PageId; }
export const PAGES_CONFIG: Record<PageId, PageConfig> = {
  home: { id: 'home', title: 'Главная', icon: 'home', requiresAuth: false, showInNav: true },
  quizzes: { id: 'quizzes', title: 'Викторины', icon: 'help-circle', requiresAuth: false, showInNav: true },
  'quiz-taking': { id: 'quiz-taking', title: 'Прохождение викторины', icon: 'play', requiresAuth: false, showInNav: false },
  results: { id: 'results', title: 'Результаты', icon: 'award', requiresAuth: true, requiredRole: 'host', showInNav: true },
  admin: { id: 'admin', title: 'Управление', icon: 'settings', requiresAuth: true, requiredRole: 'host', showInNav: true },
  'admin-quizzes': { id: 'admin-quizzes', title: 'Викторины', icon: 'help-circle', requiresAuth: true, requiredRole: 'host', showInNav: false, parentId: 'admin' },
  'admin-questions': { id: 'admin-questions', title: 'Вопросы', icon: 'file-text', requiresAuth: true, requiredRole: 'host', showInNav: false, parentId: 'admin' },
};
