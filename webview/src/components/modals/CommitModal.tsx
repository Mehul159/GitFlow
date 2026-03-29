import { useState } from "react";
import { BaseModal, ModalButton, ModalActions } from "./BaseModal";

interface CommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string, amend: boolean) => void;
  hasStagedChanges: boolean;
}

export function CommitModal({ isOpen, onClose, onConfirm, hasStagedChanges }: CommitModalProps) {
  const [message, setMessage] = useState("");
  const [amend, setAmend] = useState(false);

  const handleConfirm = () => {
    if (message.trim()) {
      onConfirm(message.trim(), amend);
      resetForm();
    }
  };

  const resetForm = () => {
    setMessage("");
    setAmend(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Commit Changes" size="lg">
      {!hasStagedChanges && (
        <div className="mb-4 rounded-lg bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-sm text-amber-300">
          No staged changes. Stage files before committing.
        </div>
      )}
      <div className="mb-4">
        <label className="mb-1 block text-sm text-neutral-400">Commit message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your changes..."
          rows={4}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && message.trim()) handleConfirm();
            if (e.key === "Escape") handleClose();
          }}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
        />
      </div>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="amend"
          checked={amend}
          onChange={(e) => setAmend(e.target.checked)}
          className="h-4 w-4 rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-orange-500"
        />
        <label htmlFor="amend" className="text-sm text-neutral-300">Amend last commit</label>
      </div>
      <p className="mb-4 text-xs text-neutral-500">Ctrl+Enter to commit</p>
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm} disabled={!message.trim() || !hasStagedChanges}>
          Commit
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
