import { ReactNode } from 'react';

export interface FilterParams { quizId?: string; status?: string; search?: string; }
export interface ApiResponse<T> { data: T; success: boolean; message?: string; }

// Select option type
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

// Table column definition
export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  width?: string | number;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

// Modal state
export interface ModalState<T = unknown> {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view' | 'delete';
  data?: T;
}

// Toast notification
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}
