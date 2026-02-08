import { observer } from 'mobx-react-lite';
import { dataStore } from '@/store';
import { Card, Table, Select } from '@/components/UI';
import type { TableColumn } from '@/components/UI';
import type { QuizResult } from '@/types';
import styles from './ResultsPage.module.scss';

export const ResultsPage = observer(() => {
  const { filteredResults, activeQuizzes, getQuizById, resultsLoading, setFilter, filters, averageScore } = dataStore;

  const quizOptions = [{ value: '', label: 'Все викторины' }, ...activeQuizzes.map(q => ({ value: q.id, label: q.title }))];

  const columns: TableColumn<QuizResult>[] = [
    { key: 'completedAt', title: 'Дата', width: '150px', render: (r: QuizResult) => new Date(r.completedAt).toLocaleString('ru-RU') },
    { key: 'participantName', title: 'Участник', render: (r: QuizResult) => r.participantName },
    { key: 'quizId', title: 'Викторина', render: (r: QuizResult) => getQuizById(r.quizId)?.title || 'Неизвестная' },
    { key: 'percentage', title: 'Результат', width: '100px', render: (r: QuizResult) => `${r.percentage}%` },
    { key: 'score', title: 'Баллы', width: '100px', render: (r: QuizResult) => `${r.score}/${r.maxScore}` },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div><h1 className={styles.title}>Результаты</h1><p className={styles.subtitle}>Статистика прохождения викторин</p></div>
      </div>

      <div className={styles.statsRow}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{filteredResults.length}</div>
          <div className={styles.statLabel}>Всего попыток</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={`${styles.statValue} ${averageScore >= 70 ? styles.success : styles.warning}`}>{averageScore}%</div>
          <div className={styles.statLabel}>Средний балл</div>
        </Card>
      </div>

      <Card className={styles.filters}>
        <Select options={quizOptions} value={filters.quizId || ''} onChange={e => setFilter('quizId', e.target.value || undefined)} />
      </Card>

      <Card padding="none">
        <Table columns={columns} data={filteredResults} keyField="id" loading={resultsLoading} emptyText="Нет результатов" />
      </Card>
    </div>
  );
});
