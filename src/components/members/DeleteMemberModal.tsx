import React from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Member } from '../../types';

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  member: Member | null;
  isDeleting: boolean;
}

export const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  member,
  isDeleting,
}) => {
  if (!isOpen || !member) return null;

  const memberName = member.full_name || member.name || 'this member';

  return (
    <div
      id="delete-member-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div
        id="delete-member-modal-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              type="button"
              id="btn-close-delete-modal"
              onClick={onClose}
              disabled={isDeleting}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-bold text-slate-900">Delete Member Profile</h3>
            <p className="text-sm text-slate-600 mt-2">
              Are you sure you want to permanently remove <strong className="text-slate-900 font-semibold">{memberName}</strong> ({member.phone}) from the gym registry?
            </p>
            <div className="mt-3 p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-xs text-rose-700">
              This action cannot be undone. Past membership records and check-in logs associated with this member will be permanently detached.
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              id="btn-cancel-delete"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-confirm-delete-member"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Member</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
