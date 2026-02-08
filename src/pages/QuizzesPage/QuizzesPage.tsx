import { observer } from 'mobx-react-lite';
import { dataStore, navigationStore, uiStore } from '@/store';
import { Card, Badge, Button } from '@/components/UI';
import type { Quiz } from '@/types';
import styles from './QuizzesPage.module.scss';

export const QuizzesPage = observer(() => {
  const { filteredQuizzes, getQuestionsForQuiz } = dataStore;

  const handleStartQuiz = (quiz: Quiz) => {
    if (quiz.status !== 'active') return;
    const questions = getQuestionsForQuiz(quiz.id);
    if (questions.length === 0) {
      uiStore.showWarning('В этой викторине пока нет вопросов');
      return;
    }
    navigationStore.navigateToQuiz(quiz.id);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>Викторины</h1><p className={styles.subtitle}>Доступные викторины для прохождения</p></div>
      </div>

      <div className={styles.quizzesGrid}>
        {filteredQuizzes.map(quiz => (
          <Card key={quiz.id} className={styles.quizCard}>
            <Badge variant={quiz.status === 'active' ? 'success' : quiz.status === 'completed' ? 'info' : 'warning'}>
              {quiz.status === 'active' ? 'Активна' : quiz.status === 'completed' ? 'Завершена' : 'Черновик'}
            </Badge>
            <h3 className={styles.quizTitle}>{quiz.title}</h3>
            <p className={styles.quizDesc}>{quiz.description}</p>
            <div className={styles.quizMeta}>
              <span>❓ {quiz.questionsCount} вопросов</span>
              {quiz.timeLimit && <span>⏱ {quiz.timeLimit} мин</span>}
            </div>
            <Button variant="primary" size="sm" onClick={() => handleStartQuiz(quiz)} disabled={quiz.status !== 'active'}>
              Начать викторину
            </Button>
          </Card>
        ))}
        {filteredQuizzes.length === 0 && <p className={styles.empty}>Викторины не найдены</p>}
      </div>
    </div>
  );
});
