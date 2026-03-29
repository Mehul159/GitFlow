import { useState } from "react";
import { BaseModal, ModalCheckbox, ModalButton, ModalActions } from "./BaseModal";

interface CleanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dirs: boolean, force: boolean) => void;
}

export function CleanModal({ isOpen, onClose, onConfirm }: CleanModalProps) {
  const [dirs, setDirs] = useState(false);
  const [force, setForce] = useState(false);

  const handleConfirm = () => {
    onConfirm(dirs, force);
    resetForm();
  };

  const resetForm = () => {
    setDirs(false);
    setForce(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Clean Untracked Files">
      <p className="mb-4 text-sm text-neutral-400">
        Remove untracked files from the working tree. This action cannot be undone.
      </p>
      <div className="mb-4 space-y-2">
        <ModalCheckbox
          checked={dirs}
          onChange={setDirs}
          label="Also remove untracked directories (-d)"
        />
        <ModalCheckbox
          checked={force}
          onChange={setForce}
          label="Force clean (bypasses gitignore)"
        />
      </div>
      <p className="mb-4 text-xs text-amber-500">
        Warning: Use with caution. Consider running a preview first.
      </p>
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm} variant="danger">Clean</ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
