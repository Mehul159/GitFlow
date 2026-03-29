import { useState } from "react";
import { BaseModal, ModalInput, ModalCheckbox, ModalButton, ModalActions } from "./BaseModal";

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (target: string, hard: boolean) => void;
}

export function ResetModal({ isOpen, onClose, onConfirm }: ResetModalProps) {
  const [target, setTarget] = useState("HEAD");
  const [hard, setHard] = useState(false);

  const handleConfirm = () => {
    if (target.trim()) {
      onConfirm(target.trim(), hard);
      resetForm();
    }
  };

  const resetForm = () => {
    setTarget("HEAD");
    setHard(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Reset to Commit">
      <ModalInput
        value={target}
        onChange={setTarget}
        placeholder="HEAD~1"
        label="Reset to"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && target.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <p className="mb-3 text-xs text-neutral-500">Use HEAD, HEAD~n, commit hash, or branch name</p>
      <div className="mb-4">
        <ModalCheckbox
          checked={hard}
          onChange={setHard}
          label="Hard reset (discard all local changes)"
        />
      </div>
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm} variant={hard ? "danger" : "primary"} disabled={!target.trim()}>
          Reset
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
