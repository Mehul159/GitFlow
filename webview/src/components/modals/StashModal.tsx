import { useState } from "react";
import { BaseModal, ModalInput, ModalCheckbox, ModalButton, ModalActions } from "./BaseModal";

interface StashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string, includeUntracked: boolean) => void;
}

export function StashModal({ isOpen, onClose, onConfirm }: StashModalProps) {
  const [message, setMessage] = useState("");
  const [includeUntracked, setIncludeUntracked] = useState(true);

  const handleConfirm = () => {
    onConfirm(message.trim() || "", includeUntracked);
    resetForm();
  };

  const resetForm = () => {
    setMessage("");
    setIncludeUntracked(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Stash Changes">
      <ModalInput
        value={message}
        onChange={setMessage}
        placeholder="Optional stash message"
        label="Stash message (optional)"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <div className="mb-4">
        <ModalCheckbox
          checked={includeUntracked}
          onChange={setIncludeUntracked}
          label="Include untracked files"
        />
      </div>
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm}>Stash</ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
