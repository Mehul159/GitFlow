import { useState } from "react";
import { BaseModal, ModalInput, ModalButton, ModalActions } from "./BaseModal";

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, email: string) => void;
  initialName?: string;
  initialEmail?: string;
}

export function ConfigModal({ isOpen, onClose, onConfirm, initialName = "", initialEmail = "" }: ConfigModalProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  const handleConfirm = () => {
    onConfirm(name.trim(), email.trim());
    onClose();
  };

  const handleClose = () => {
    setName(initialName);
    setEmail(initialEmail);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Git Configuration">
      <p className="mb-4 text-sm text-neutral-400">
        Set your local Git user identity.
      </p>
      <ModalInput
        value={name}
        onChange={setName}
        placeholder="Your Name"
        label="user.name"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <ModalInput
        value={email}
        onChange={setEmail}
        placeholder="your@email.com"
        label="user.email"
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm} disabled={!name.trim()}>Save</ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
