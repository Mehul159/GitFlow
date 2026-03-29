import { useState } from "react";
import { BaseModal, ModalInput, ModalCheckbox, ModalButton, ModalActions } from "./BaseModal";

interface MergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (branch: string, squash: boolean, noFf: boolean) => void;
}

export function MergeModal({ isOpen, onClose, onConfirm }: MergeModalProps) {
  const [branch, setBranch] = useState("");
  const [squash, setSquash] = useState(false);
  const [noFf, setNoFf] = useState(false);

  const handleConfirm = () => {
    if (branch.trim()) {
      onConfirm(branch.trim(), squash, noFf);
      resetForm();
    }
  };

  const resetForm = () => {
    setBranch("");
    setSquash(false);
    setNoFf(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Merge Branch">
      <ModalInput
        value={branch}
        onChange={setBranch}
        placeholder="main"
        label="Branch to merge"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && branch.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <div className="mb-2 space-y-2">
        <ModalCheckbox
          checked={squash}
          onChange={(checked) => {
            setSquash(checked);
            if (checked) setNoFf(false);
          }}
          label="Squash merge (staged for commit)"
        />
        {!squash && (
          <ModalCheckbox
            checked={noFf}
            onChange={setNoFf}
            label="Create merge commit even if fast-forward (--no-ff)"
          />
        )}
      </div>
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm} disabled={!branch.trim()}>Merge</ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
