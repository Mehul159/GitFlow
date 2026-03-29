import { useState } from "react";
import { BaseModal, ModalInput, ModalCheckbox, ModalButton, ModalActions } from "./BaseModal";

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, message: string, annotate: boolean) => void;
}

export function TagModal({ isOpen, onClose, onConfirm }: TagModalProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [annotate, setAnnotate] = useState(true);

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim(), message.trim(), annotate);
      resetForm();
    }
  };

  const resetForm = () => {
    setName("");
    setMessage("");
    setAnnotate(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Create Tag">
      <ModalInput
        value={name}
        onChange={setName}
        placeholder="v1.0.0"
        label="Tag name"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <div className="mb-4">
        <ModalCheckbox
          checked={annotate}
          onChange={setAnnotate}
          label="Annotated tag (with message)"
        />
      </div>
      {annotate && (
        <div className="mb-4">
          <label className="mb-1 block text-sm text-neutral-400">Tag message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Release version 1.0.0"
            rows={3}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
          />
        </div>
      )}
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm} disabled={!name.trim()}>Create Tag</ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
