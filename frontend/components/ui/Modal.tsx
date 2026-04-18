'use client';

import { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Annuler',
  onConfirm,
  loading = false,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
      // Le modal sera fermé par le onConfirm lui-même
    } else {
      onClose();
    }
  };

  const iconConfig = {
    success: { Icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    error: { Icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    warning: { Icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    info: { Icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
    confirm: { Icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  };

  const { Icon, color, bg } = iconConfig[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {!loading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-7 h-7 ${color}`} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-slate-900 text-center mb-2">{title}</h3>

          {/* Message */}
          <p className="text-sm text-slate-600 text-center leading-relaxed">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {type === 'confirm' ? (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  loading={loading}
                  disabled={loading}
                  className="flex-1"
                >
                  {confirmText}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={onClose}
                disabled={loading}
                className="w-full"
              >
                {confirmText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
