import { useState } from "react";
import { BaseModal, ModalInput, ModalButton, ModalActions } from "./BaseModal";

interface RebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (onto: string) => void;
}

export function RebaseModal({ isOpen, onClose, onConfirm }: RebaseModalProps) {
  const [branch, setBranch] = useState("");

  const handleConfirm = () => {
    if (branch.trim()) {
      onConfirm(branch.trim());
      resetForm();
    }
  };

  const resetForm = () => setBranch("");

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Rebase Branch">
      <ModalInput
        value={branch}
        onChange={setBranch}
        placeholder="main"
        label="Rebase onto"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && branch.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <p className="mb-4 text-xs text-neutral-500">Rebase current branch onto the specified branch</p>
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm} disabled={!branch.trim()}>Rebase</ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
