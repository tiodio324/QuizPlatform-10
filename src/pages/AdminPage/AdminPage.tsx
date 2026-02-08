import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { v4 as uuidv4 } from 'uuid';
import { dataStore, authStore, uiStore } from '@/store';
import { Card, Button, Table, Modal, Input, Badge } from '@/components/UI';
import type { TableColumn } from '@/components/UI';
import type { Quiz, QuizFormData, QuizStatus, QuestionFormData, QuestionOption } from '@/types';
import styles from './AdminPage.module.scss';

interface QuestionDraft {
  id: string;
  text: string;
  options: QuestionOption[];
  points: number;
}

const emptyQuestion = (): QuestionDraft => ({
  id: uuidv4(),
  text: '',
  options: [
    { id: uuidv4(), text: '', isCorrect: false },
    { id: uuidv4(), text: '', isCorrect: false },
  ],
  points: 1,
});

type AdminTab = 'quizzes';

export const AdminPage = observer(() => {
  const { quizzes, quizzesLoading, createQuiz, updateQuiz, deleteQuiz, changeQuizStatus, getQuestionsForQuiz, saveQuestionsForQuiz } = dataStore;
  const { isAdmin } = authStore;

  const [_activeTab, _setActiveTab] = useState<AdminTab>('quizzes');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuizFormData>({ title: '', description: '', timeLimit: undefined });
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ title: '', description: '', timeLimit: undefined });
    setEditingId(null);
    setQuestions([]);
    setExpandedQ(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalMode('create');
    setModalOpen(true);
  };

  const openEditModal = (q: Quiz) => {
    setModalMode('edit');
    setEditingId(q.id);
    setForm({ title: q.title, description: q.description, timeLimit: q.timeLimit });
    // Load existing questions
    const existingQuestions = getQuestionsForQuiz(q.id);
    setQuestions(existingQuestions.map(eq => ({
      id: eq.id,
      text: eq.text,
      options: eq.options.map(o => ({ ...o })),
      points: eq.points,
    })));
    setExpandedQ(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) { uiStore.showError('Введите название'); return; }
    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) { uiStore.showError(`Вопрос ${i + 1}: введите текст вопроса`); return; }
      if (q.options.length < 2) { uiStore.showError(`Вопрос ${i + 1}: нужно минимум 2 варианта ответа`); return; }
      const hasEmpty = q.options.some(o => !o.text.trim());
      if (hasEmpty) { uiStore.showError(`Вопрос ${i + 1}: заполните все варианты ответа`); return; }
      const hasCorrect = q.options.some(o => o.isCorrect);
      if (!hasCorrect) { uiStore.showError(`Вопрос ${i + 1}: отметьте правильный ответ`); return; }
    }
    try {
      let quizId = editingId;
      if (modalMode === 'create') {
        const created = await createQuiz(form);
        if (created) quizId = created.id;
        else { uiStore.showError('Ошибка создания викторины'); return; }
      } else if (editingId) {
        await updateQuiz(editingId, form);
      }
      // Save questions
      if (quizId) {
        const questionsData: QuestionFormData[] = questions.map(q => ({
          quizId,
          text: q.text,
          options: q.options,
          points: q.points,
        }));
        await saveQuestionsForQuiz(quizId, questionsData);
      }
      uiStore.showSuccess('Сохранено');
      setModalOpen(false);
      resetForm();
    } catch { uiStore.showError('Ошибка'); }
  };

  const handleDelete = (id: string) => {
    uiStore.showConfirm('Удаление', 'Удалить викторину?', async () => { await deleteQuiz(id); uiStore.showSuccess('Удалено'); });
  };

  const handleStatusChange = async (quiz: Quiz, newStatus: QuizStatus) => {
    if (!isAdmin) { uiStore.showError('Только администратор может менять статус'); return; }
    if (newStatus === 'active' && quiz.questionsCount === 0) {
      uiStore.showError('Невозможно опубликовать викторину без вопросов');
      return;
    }
    const labels: Record<QuizStatus, string> = { draft: 'черновик', active: 'активна', completed: 'завершена' };
    uiStore.showConfirm('Изменение статуса', `Изменить статус на "${labels[newStatus]}"?`, async () => {
      const ok = await changeQuizStatus(quiz.id, newStatus);
      if (ok) uiStore.showSuccess(`Статус изменён: ${labels[newStatus]}`);
      else uiStore.showError('Ошибка изменения статуса');
    }, undefined, { confirmLabel: 'Подтвердить', confirmVariant: 'primary' });
  };

  // Question builder helpers
  const addQuestion = () => {
    const q = emptyQuestion();
    setQuestions([...questions, q]);
    setExpandedQ(q.id);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (expandedQ === id) setExpandedQ(null);
  };

  const updateQuestion = (id: string, updates: Partial<QuestionDraft>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      return { ...q, options: [...q.options, { id: uuidv4(), text: '', isCorrect: false }] };
    }));
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      return { ...q, options: q.options.filter(o => o.id !== optionId) };
    }));
  };

  const updateOption = (questionId: string, optionId: string, updates: Partial<QuestionOption>) => {
    setQuestions(questions.map(q => {
      if (q.id !== questionId) return q;
      return {
        ...q,
        options: q.options.map(o => o.id === optionId ? { ...o, ...updates } : o),
      };
    }));
  };

  const columns: TableColumn<Quiz>[] = [
    { key: 'title', title: 'Название', render: (q: Quiz) => q.title },
    { key: 'status', title: 'Статус', width: '120px', render: (q: Quiz) => {
      const variants: Record<QuizStatus, 'primary' | 'success' | 'warning'> = { draft: 'warning', active: 'success', completed: 'primary' };
      const labels: Record<QuizStatus, string> = { draft: 'Черновик', active: 'Активна', completed: 'Завершена' };
      return <Badge variant={variants[q.status]}>{labels[q.status]}</Badge>;
    }},
    { key: 'questionsCount', title: 'Вопросов', width: '90px', render: (q: Quiz) => String(q.questionsCount) },
    { key: 'statusActions', title: 'Публикация', width: '160px', render: (q: Quiz) => {
      if (!isAdmin) return <span className={styles.noAccess}>Только админ</span>;
      return (
        <div className={styles.statusActions}>
          {q.status === 'draft' && (
            <Button size="sm" variant="primary" onClick={() => handleStatusChange(q, 'active')}>
              Опубликовать
            </Button>
          )}
          {q.status === 'active' && (
            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(q, 'completed')}>
              Завершить
            </Button>
          )}
          {q.status === 'completed' && (
            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(q, 'draft')}>
              В черновик
            </Button>
          )}
        </div>
      );
    }},
    { key: 'actions', title: '', width: '100px', render: (r: Quiz) => (
      <div className={styles.actions}>
        <Button size="sm" variant="ghost" onClick={() => openEditModal(r)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></Button>
        <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg></Button>
      </div>
    )},
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}><h1 className={styles.title}>Управление викторинами</h1></div>
      <Card className={styles.toolbar}><Button variant="primary" onClick={openCreateModal}>Создать викторину</Button></Card>
      <Card padding="none">
        <Table columns={columns} data={quizzes.filter(q => q.isActive)} keyField="id" loading={quizzesLoading} emptyText="Нет викторин" />
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalMode === 'create' ? 'Создать викторину' : 'Редактировать'} size="lg"
        footer={<div className={styles.modalFooter}><Button variant="ghost" onClick={() => setModalOpen(false)}>Отмена</Button><Button variant="primary" onClick={handleSave}>Сохранить</Button></div>}>
        <div className={styles.form}>
          <Input label="Название *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="Описание" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <Input label="Лимит времени (мин)" type="number" min={1} value={form.timeLimit || ''} onChange={e => setForm({ ...form, timeLimit: e.target.value ? parseInt(e.target.value) : undefined })} />

          {/* Question Constructor */}
          <div className={styles.questionsSection}>
            <div className={styles.questionsSectionHeader}>
              <h3 className={styles.questionsSectionTitle}>Вопросы ({questions.length})</h3>
              <Button variant="primary" size="sm" onClick={addQuestion}>+ Добавить вопрос</Button>
            </div>

            {questions.length === 0 && (
              <p className={styles.questionsEmpty}>Нажмите «Добавить вопрос», чтобы создать вопросы для викторины</p>
            )}

            <div className={styles.questionsList}>
              {questions.map((q, idx) => (
                <div key={q.id} className={`${styles.questionItem} ${expandedQ === q.id ? styles.questionExpanded : ''}`}>
                  <div className={styles.questionHeader} onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}>
                    <div className={styles.questionHeaderLeft}>
                      <span className={styles.questionNumber}>{idx + 1}</span>
                      <span className={styles.questionPreview}>{q.text || 'Новый вопрос'}</span>
                    </div>
                    <div className={styles.questionHeaderRight}>
                      <span className={styles.questionPoints}>{q.points} б.</span>
                      <button className={styles.questionDelete} onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }} title="Удалить вопрос">✕</button>
                      <span className={styles.questionChevron}>{expandedQ === q.id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {expandedQ === q.id && (
                    <div className={styles.questionBody}>
                      <Input
                        label="Текст вопроса *"
                        value={q.text}
                        onChange={e => updateQuestion(q.id, { text: e.target.value })}
                        placeholder="Введите текст вопроса..."
                      />
                      <Input
                        label="Баллы"
                        type="number"
                        min={1}
                        value={q.points}
                        onChange={e => updateQuestion(q.id, { points: parseInt(e.target.value) || 1 })}
                      />

                      <div className={styles.optionsSection}>
                        <label className={styles.optionsLabel}>Варианты ответа (отметьте правильные)</label>
                        <div className={styles.optionsList}>
                          {q.options.map((opt, optIdx) => (
                            <div key={opt.id} className={styles.optionItem}>
                              <label className={styles.optionCheck}>
                                <input
                                  type="checkbox"
                                  checked={opt.isCorrect}
                                  onChange={() => updateOption(q.id, opt.id, { isCorrect: !opt.isCorrect })}
                                  className={styles.optionCheckInput}
                                />
                                <span className={`${styles.optionCheckmark} ${opt.isCorrect ? styles.optionCorrect : ''}`}>
                                  {opt.isCorrect ? '✓' : ''}
                                </span>
                              </label>
                              <input
                                type="text"
                                className={styles.optionTextInput}
                                value={opt.text}
                                onChange={e => updateOption(q.id, opt.id, { text: e.target.value })}
                                placeholder={`Вариант ${optIdx + 1}`}
                              />
                              {q.options.length > 2 && (
                                <button className={styles.optionRemove} onClick={() => removeOption(q.id, opt.id)} title="Удалить вариант">✕</button>
                              )}
                            </div>
                          ))}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => addOption(q.id)}>+ Добавить вариант</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
});
