import React from 'react';
import Modal from './Modal';

/**
 * ConfirmDialog — Reusable confirmation dialog with consistent styling.
 * Replaces native window.confirm() and window.prompt() with accessible, styled dialogs.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary' | 'danger' | 'warning'
  onConfirm,
  loading = false,
  input = null, // { value, onChange, placeholder, type } for prompt-like behavior
}) {
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500',
    danger: 'bg-rose-600 hover:bg-rose-500',
    warning: 'bg-amber-600 hover:bg-amber-500',
  };

  const handleConfirm = () => {
    if (input) {
      onConfirm(input.value);
    } else {
      onConfirm(true);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>

        {input && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {input.label || 'Input'}
            </label>
            <input
              type={input.type || 'text'}
              value={input.value}
              onChange={input.onChange}
              placeholder={input.placeholder || ''}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {input.helperText && <p className="text-xs text-slate-400">{input.helperText}</p>}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors min-h-[44px]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (input && !input.value?.trim())}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors min-h-[44px] ${
              loading
                ? 'opacity-50 cursor-not-allowed'
                : variantStyles[variant]
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}