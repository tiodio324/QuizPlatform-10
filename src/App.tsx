import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { navigationStore, dataStore } from '@/store';
import { MainLayout, LoginModal, ConfirmModal, Toast } from '@/components';
import { HomePage, QuizzesPage, QuizTakingPage, ResultsPage, AdminPage } from '@/pages';

const PageRouter = observer(() => {
  const { currentPage } = navigationStore;
  switch (currentPage) {
    case 'home': return <HomePage />;
    case 'quizzes': return <QuizzesPage />;
    case 'quiz-taking': return <QuizTakingPage />;
    case 'results': return <ResultsPage />;
    case 'admin': case 'admin-quizzes': case 'admin-questions': return <AdminPage />;
    default: return <HomePage />;
  }
});

const App = observer(() => { useEffect(() => { dataStore.loadAllData(); }, []); return (<><MainLayout><PageRouter /></MainLayout><LoginModal /><ConfirmModal /><Toast /></>); });
export default App;
