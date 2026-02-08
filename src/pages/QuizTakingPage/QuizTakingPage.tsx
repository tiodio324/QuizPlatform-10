import { useState, useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { dataStore, navigationStore, uiStore } from '@/store';
import { Card, Button, Badge } from '@/components/UI';
import styles from './QuizTakingPage.module.scss';

export const QuizTakingPage = observer(() => {
  const { activeQuizId } = navigationStore;
  const quiz = activeQuizId ? dataStore.getQuizById(activeQuizId) : null;
  const questions = activeQuizId ? dataStore.getQuestionsForQuiz(activeQuizId) : [];

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [result, setResult] = useState<{ score: number; maxScore: number; percentage: number } | null>(null);
  const [startedAt] = useState(new Date().toISOString());
  const [participantName, setParticipantName] = useState('');
  const [nameEntered, setNameEntered] = useState(false);

  // Initialize timer when quiz loads
  useEffect(() => {
    if (quiz && quiz.timeLimit && !timerStarted && nameEntered) {
      setTimeLeft(quiz.timeLimit * 60);
      setTimerStarted(true);
    }
  }, [quiz, timerStarted, nameEntered]);

  // Countdown timer using setTimeout chain
  useEffect(() => {
    if (isFinished || timeLeft <= 0 || !timerStarted) return;

    const id = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [timeLeft, isFinished, timerStarted]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleOption = (questionId: string, optionId: string) => {
    if (isFinished) return;
    setAnswers(prev => {
      const current = prev[questionId] || [];
      const correctCount = questions.find(q => q.id === questionId)?.options.filter(o => o.isCorrect).length || 1;
      if (correctCount === 1) {
        // Single choice: replace answer
        return { ...prev, [questionId]: [optionId] };
      } else {
        // Multiple choice: toggle
        const updated = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: updated };
      }
    });
  };

  const calculateResult = useCallback(() => {
    let score = 0;
    let maxScore = 0;

    for (const q of questions) {
      maxScore += q.points;
      const selectedIds = answers[q.id] || [];
      const correctIds = q.options.filter(o => o.isCorrect).map(o => o.id);
      const allCorrect = correctIds.length === selectedIds.length &&
        correctIds.every(id => selectedIds.includes(id)) &&
        selectedIds.every(id => correctIds.includes(id));
      if (allCorrect) {
        score += q.points;
      }
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    return { score, maxScore, percentage };
  }, [answers, questions]);

  const handleSubmit = async () => {
    const res = calculateResult();
    setResult(res);
    setIsFinished(true);

    // Save result to database
    if (quiz) {
      await dataStore.submitResult({
        quizId: quiz.id,
        participantName: participantName || 'Участник',
        score: res.score,
        maxScore: res.maxScore,
        percentage: res.percentage,
        answers,
        startedAt,
        completedAt: new Date().toISOString(),
      });
    }
  };

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && timerStarted && !isFinished && quiz) {
      handleSubmit();
    }
  }, [timeLeft, timerStarted, isFinished, quiz]);

  const handleConfirmSubmit = () => {
    const answeredCount = Object.keys(answers).filter(k => answers[k].length > 0).length;
    if (answeredCount < questions.length) {
      uiStore.showConfirm(
        'Завершить викторину?',
        `Вы ответили на ${answeredCount} из ${questions.length} вопросов. Завершить?`,
        handleSubmit
      );
    } else {
      handleSubmit();
    }
  };

  const handleBackToQuizzes = () => {
    navigationStore.navigate('quizzes');
  };

  const handleStartWithName = () => {
    if (!participantName.trim()) {
      uiStore.showError('Введите ваше имя');
      return;
    }
    setNameEntered(true);
  };

  if (!quiz) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <h2>Викторина не найдена</h2>
          <Button variant="primary" onClick={handleBackToQuizzes}>Вернуться к викторинам</Button>
        </div>
      </div>
    );
  }

  // Name entry screen
  if (!nameEntered) {
    return (
      <div className={styles.page}>
        <Card className={styles.nameCard}>
          <h2 className={styles.nameTitle}>{quiz.title}</h2>
          {quiz.description && <p className={styles.nameDesc}>{quiz.description}</p>}
          <div className={styles.nameMeta}>
            <span>❓ {questions.length} вопросов</span>
            {quiz.timeLimit && <span>⏱ {quiz.timeLimit} мин</span>}
          </div>
          <div className={styles.nameInput}>
            <label className={styles.nameLabel}>Ваше имя</label>
            <input
              type="text"
              className={styles.nameField}
              value={participantName}
              onChange={e => setParticipantName(e.target.value)}
              placeholder="Введите ваше имя..."
              onKeyDown={e => e.key === 'Enter' && handleStartWithName()}
              autoFocus
            />
          </div>
          <div className={styles.nameActions}>
            <Button variant="ghost" onClick={handleBackToQuizzes}>Назад</Button>
            <Button variant="primary" onClick={handleStartWithName}>Начать</Button>
          </div>
        </Card>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter(k => answers[k].length > 0).length;
  const hasTimeLimit = quiz.timeLimit && quiz.timeLimit > 0;
  const timerDanger = hasTimeLimit && timeLeft <= 60;
  const timerWarning = hasTimeLimit && timeLeft <= 300 && !timerDanger;

  return (
    <div className={styles.page}>
      {/* Header with timer */}
      <div className={styles.quizHeader}>
        <div className={styles.quizHeaderLeft}>
          {!isFinished && (
            <Button variant="ghost" size="sm" onClick={handleBackToQuizzes} className={styles.backBtn}>← Назад</Button>
          )}
          <div>
            <h1 className={styles.quizTitle}>{quiz.title}</h1>
            <p className={styles.quizSubtitle}>
              {isFinished ? 'Викторина завершена' : `${answeredCount} из ${questions.length} вопросов отвечено`}
            </p>
          </div>
        </div>
        {!isFinished && hasTimeLimit && (
          <div className={`${styles.timer} ${timerDanger ? styles.timerDanger : ''} ${timerWarning ? styles.timerWarning : ''}`}>
            <span className={styles.timerIcon}>⏱</span>
            <span className={styles.timerValue}>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!isFinished && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }} />
        </div>
      )}

      {/* Results card */}
      {isFinished && result && (
        <Card className={styles.resultCard}>
          <div className={styles.resultHeader}>
            <span className={styles.resultEmoji}>{result.percentage >= 70 ? '🎉' : result.percentage >= 40 ? '👍' : '😔'}</span>
            <h2 className={styles.resultTitle}>
              {result.percentage >= 70 ? 'Отличный результат!' : result.percentage >= 40 ? 'Неплохо!' : 'Попробуйте ещё раз'}
            </h2>
          </div>
          <div className={styles.resultStats}>
            <div className={styles.resultStat}>
              <span className={styles.resultStatValue}>{result.percentage}%</span>
              <span className={styles.resultStatLabel}>Результат</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.resultStatValue}>{result.score}/{result.maxScore}</span>
              <span className={styles.resultStatLabel}>Баллы</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.resultStatValue}>{questions.length}</span>
              <span className={styles.resultStatLabel}>Вопросов</span>
            </div>
          </div>
          <Button variant="primary" onClick={handleBackToQuizzes}>Вернуться к викторинам</Button>
        </Card>
      )}

      {/* Questions */}
      <div className={styles.questionsList}>
        {questions.map((q, idx) => {
          const correctCount = q.options.filter(o => o.isCorrect).length;
          const isSingleChoice = correctCount === 1;
          const selected = answers[q.id] || [];

          return (
            <Card key={q.id} className={styles.questionCard}>
              <div className={styles.questionTop}>
                <span className={styles.questionNum}>Вопрос {idx + 1}</span>
                <Badge variant={isSingleChoice ? 'info' : 'primary'} size="sm">
                  {isSingleChoice ? 'Один ответ' : 'Несколько ответов'}
                </Badge>
                <span className={styles.questionPts}>{q.points} б.</span>
              </div>
              <h3 className={styles.questionText}>{q.text}</h3>

              <div className={styles.optionsList}>
                {q.options.map(opt => {
                  const isSelected = selected.includes(opt.id);
                  const showCorrect = isFinished && opt.isCorrect;
                  const showWrong = isFinished && isSelected && !opt.isCorrect;
                  return (
                    <label
                      key={opt.id}
                      className={`${styles.optionLabel} ${isSelected ? styles.optionSelected : ''} ${showCorrect ? styles.optionCorrectAnswer : ''} ${showWrong ? styles.optionWrongAnswer : ''}`}
                    >
                      <input
                        type={isSingleChoice ? 'radio' : 'checkbox'}
                        name={`q-${q.id}`}
                        checked={isSelected}
                        onChange={() => handleToggleOption(q.id, opt.id)}
                        disabled={isFinished}
                        className={styles.hiddenInput}
                      />
                      <span className={isSingleChoice ? styles.optionRadio : styles.optionCheckbox}>
                        {isSingleChoice
                          ? (isSelected && <span className={styles.optionRadioDot} />)
                          : (isSelected && <span className={styles.optionCheckIcon}>✓</span>)
                        }
                      </span>
                      <span className={styles.optionText}>{opt.text}</span>
                      {showCorrect && <span className={styles.correctMark}>✓</span>}
                      {showWrong && <span className={styles.wrongMark}>✕</span>}
                    </label>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Submit button */}
      {!isFinished && (
        <div className={styles.submitSection}>
          <Button variant="primary" onClick={handleConfirmSubmit} className={styles.submitBtn}>
            Завершить викторину
          </Button>
        </div>
      )}
    </div>
  );
});
