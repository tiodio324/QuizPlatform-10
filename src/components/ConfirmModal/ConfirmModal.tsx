import { observer } from 'mobx-react-lite';
import { uiStore } from '@/store';
import { Modal, Button } from '@/components/UI';
import styles from './ConfirmModal.module.scss';

export const ConfirmModal = observer(() => {
  const { confirmModalState, confirmAction, cancelAction } = uiStore;

  const buttonVariant = confirmModalState.confirmVariant || 'danger';
  const buttonLabel = confirmModalState.confirmLabel || 'Удалить';

  return (
    <Modal
      isOpen={confirmModalState.isOpen}
      onClose={cancelAction}
      title={confirmModalState.title}
      size="sm"
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" onClick={cancelAction}>
            Отмена
          </Button>
          <Button variant={buttonVariant} onClick={confirmAction}>
            {buttonLabel}
          </Button>
        </div>
      }
    >
      <p className={styles.message}>{confirmModalState.message}</p>
    </Modal>
  );
});
