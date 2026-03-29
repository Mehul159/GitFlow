import { useState } from "react";
import { BaseModal, ModalInput, ModalButton, ModalActions } from "./BaseModal";

interface RemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, url: string) => void;
}

export function RemoteModal({ isOpen, onClose, onConfirm }: RemoteModalProps) {
  const [name, setName] = useState("origin");
  const [url, setUrl] = useState("");

  const handleConfirm = () => {
    if (name.trim() && url.trim()) {
      onConfirm(name.trim(), url.trim());
      resetForm();
    }
  };

  const resetForm = () => {
    setName("origin");
    setUrl("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Add Remote">
      <ModalInput
        value={name}
        onChange={setName}
        placeholder="origin"
        label="Remote name"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && url.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <ModalInput
        value={url}
        onChange={setUrl}
        placeholder="https://github.com/user/repo.git"
        label="Repository URL"
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm} disabled={!name.trim() || !url.trim()}>Add Remote</ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
