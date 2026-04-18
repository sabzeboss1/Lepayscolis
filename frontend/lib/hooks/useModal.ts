'use client';

import { useState } from 'react';

export interface ModalConfig {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
}

export interface ModalState extends ModalConfig {
  isOpen: boolean;
  loading: boolean;
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    loading: false,
  });

  const showModal = (config: ModalConfig) => {
    setModalState({
      ...config,
      isOpen: true,
      loading: false,
      onConfirm: config.onConfirm,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false, loading: false }));
  };

  return {
    modalState,
    showModal,
    closeModal,
  };
}
