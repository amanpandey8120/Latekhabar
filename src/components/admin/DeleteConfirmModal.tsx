import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  /** Display name shown in the confirmation message */
  userName: string;
  /** Email shown as secondary identifier */
  userEmail: string;
  /** Whether the delete request is in-flight */
  deleting: boolean;
  /** Exact error message from the Edge Function, if any */
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  userName,
  userEmail,
  deleting,
  error,
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the Cancel button on open (safe default for destructive dialogs)
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Close on Escape unless deletion is in progress
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleting, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-desc"
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-[#1c1c1c] rounded-2xl border border-gray-800 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={17} />
            <h2 id="delete-dialog-title" className="text-sm font-bold text-white">
              Delete User
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={deleting}
            aria-label="Close"
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <p id="delete-dialog-desc" className="text-sm text-gray-300 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <span className="font-bold text-white">
              {userName || userEmail}
            </span>
            ?
          </p>

          <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 text-xs text-gray-400 space-y-0.5">
            {userName && <p><span className="text-gray-600">Name:</span> {userName}</p>}
            <p><span className="text-gray-600">Email:</span> {userEmail}</p>
          </div>

          <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-400">
            <strong>This action is irreversible.</strong> The user will be removed from
            Supabase Authentication and their profile record will be deleted.
          </div>

          {/* Error from Edge Function */}
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-red-700 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60 shadow-lg cursor-pointer"
          >
            {deleting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 size={13} />
                Delete User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
