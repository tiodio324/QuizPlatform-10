import { observer } from 'mobx-react-lite';
import { dataStore, authStore, navigationStore } from '@/store';
import { Card, Button, Badge } from '@/components/UI';
import styles from './HomePage.module.scss';

const StatCard = ({ title, value, icon, color }: { title: string; value: number | string; icon: React.ReactNode; color: 'primary' | 'success' | 'warning' | 'info'; }) => (
  <Card className={`${styles.statCard} ${styles[color]}`}>
    <div className={styles.statIcon}>{icon}</div>
    <div className={styles.statContent}><span className={styles.statValue}>{value}</span><span className={styles.statTitle}>{title}</span></div>
  </Card>
);

export const HomePage = observer(() => {
  const { activeQuizzes, totalParticipants, averageScore, quizzesLoading } = dataStore;
  const { isHost, isAdmin } = authStore;
  const { navigate } = navigationStore;

  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.welcomeTitle}>Платформа викторин</h1>
          <p className={styles.welcomeText}>
            Интерактивные викторины и квизы в реальном времени.
            {!isHost && ' Войдите для создания викторин.'}
          </p>
          {!authStore.isAuthenticated && (
            <Button variant="primary" size="lg" onClick={() => authStore.openLoginModal()}>Войти</Button>
          )}
        </div>
        <div className={styles.welcomeDecor}>
          <svg viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" opacity="0.2" />
            <path d="M70 100 L90 120 L130 80" stroke="currentColor" strokeWidth="4" opacity="0.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      <section className={styles.stats}>
        <StatCard title="Викторин" value={quizzesLoading ? '...' : activeQuizzes.length} color="primary"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>} />
        {isHost && <>
          <StatCard title="Участников" value={totalParticipants} color="info"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>} />
          <StatCard title="Средний балл" value={`${averageScore}%`} color={averageScore >= 70 ? 'success' : 'warning'}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>} />
        </>}
      </section>

      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Разделы</h2>
        <div className={styles.actionCards}>
          <Card className={styles.actionCard} hoverable onClick={() => navigate('quizzes')}>
            <div className={styles.actionIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <h3>Викторины</h3>
            <p>Принять участие</p>
            <Badge variant="primary">{activeQuizzes.length} викторин</Badge>
          </Card>

          {isHost && (
            <Card className={styles.actionCard} hoverable onClick={() => navigate('results')}>
              <div className={styles.actionIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
              </div>
              <h3>Результаты</h3>
              <p>Статистика участников</p>
            </Card>
          )}

          {isAdmin && (
            <Card className={styles.actionCard} hoverable onClick={() => navigate('admin')}>
              <div className={styles.actionIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
              </div>
              <h3>Управление</h3>
              <p>Создание викторин</p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
});
