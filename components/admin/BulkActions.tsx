'use client';

import { useState } from 'react';
import { ChevronDown, X, AlertTriangle } from 'lucide-react';

export interface BulkAction {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'danger';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface BulkActionsProps {
  selectedCount: number;
  actions: BulkAction[];
  onAction: (actionKey: string) => void;
  onClearSelection: () => void;
}

export default function BulkActions({
  selectedCount,
  actions,
  onAction,
  onClearSelection
}: BulkActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);

  if (selectedCount === 0) {
    return null;
  }

  const handleActionClick = (action: BulkAction) => {
    setShowDropdown(false);

    if (action.requiresConfirmation) {
      setConfirmAction(action);
    } else {
      onAction(action.key);
    }
  };

  const handleConfirm = () => {
    if (confirmAction) {
      onAction(confirmAction.key);
      setConfirmAction(null);
    }
  };

  const handleCancel = () => {
    setConfirmAction(null);
  };

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </span>
            <button
              onClick={onClearSelection}
              className="flex items-center space-x-1 text-sm text-blue-700 hover:text-blue-900 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Clear selection</span>
            </button>
          </div>

          {/* Actions dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Actions</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  {actions.map((action) => {
                    const Icon = action.icon;
                    const isDanger = action.variant === 'danger';

                    return (
                      <button
                        key={action.key}
                        onClick={() => handleActionClick(action)}
                        className={`
                          w-full flex items-center space-x-3 px-4 py-2 text-sm transition-colors
                          ${
                            isDanger
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div
                  className={`
                    flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                    ${
                      confirmAction.variant === 'danger'
                        ? 'bg-red-100'
                        : 'bg-blue-100'
                    }
                  `}
                >
                  <AlertTriangle
                    className={`
                      w-6 h-6
                      ${
                        confirmAction.variant === 'danger'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }
                    `}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Confirm Action
                  </h3>
                  <p className="text-sm text-gray-600">
                    {confirmAction.confirmationMessage ||
                      `Are you sure you want to ${confirmAction.label.toLowerCase()} ${selectedCount} ${
                        selectedCount === 1 ? 'item' : 'items'
                      }?`}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 rounded-b-lg">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors
                  ${
                    confirmAction.variant === 'danger'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }
                `}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
