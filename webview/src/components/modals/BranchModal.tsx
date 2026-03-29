import { useState } from "react";
import { BaseModal, ModalInput, ModalCheckbox, ModalButton, ModalActions } from "./BaseModal";

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, checkout: boolean, startPoint?: string) => void;
}

export function BranchModal({ isOpen, onClose, onConfirm }: BranchModalProps) {
  const [name, setName] = useState("");
  const [checkout, setCheckout] = useState(true);
  const [startPoint, setStartPoint] = useState("");

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim(), checkout, startPoint.trim() || undefined);
      resetForm();
    }
  };

  const resetForm = () => {
    setName("");
    setCheckout(true);
    setStartPoint("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Create New Branch">
      <ModalInput
        value={name}
        onChange={setName}
        placeholder="feature/my-branch"
        label="Branch name"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <ModalInput
        value={startPoint}
        onChange={setStartPoint}
        placeholder="HEAD or commit/branch"
        label="Start point (optional)"
        onKeyDown={(e) => {
          if (e.key === "Escape") handleClose();
        }}
      />
      <div className="mb-4">
        <ModalCheckbox
          checked={checkout}
          onChange={setCheckout}
          label="Checkout new branch after creation"
        />
      </div>
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm} disabled={!name.trim()}>Create Branch</ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
