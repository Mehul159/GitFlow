import { useState } from "react";
import { BaseModal, ModalInput, ModalCheckbox, ModalButton, ModalActions } from "./BaseModal";

interface CloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (url: string, directory: string, depth?: number) => void;
}

export function CloneModal({ isOpen, onClose, onConfirm }: CloneModalProps) {
  const [url, setUrl] = useState("");
  const [directory, setDirectory] = useState("");
  const [depth, setDepth] = useState(false);

  const handleConfirm = () => {
    if (url.trim()) {
      const dir = directory.trim() || undefined;
      const depthNum = depth ? 1 : undefined;
      onConfirm(url.trim(), dir || "", depthNum);
      resetForm();
    }
  };

  const resetForm = () => {
    setUrl("");
    setDirectory("");
    setDepth(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Clone Repository" size="lg">
      <ModalInput
        value={url}
        onChange={setUrl}
        placeholder="https://github.com/user/repo.git"
        label="Repository URL"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && url.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <ModalInput
        value={directory}
        onChange={setDirectory}
        placeholder="repo (optional)"
        label="Directory name (optional)"
        onKeyDown={(e) => {
          if (e.key === "Enter" && url.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <div className="mb-4">
        <ModalCheckbox
          checked={depth}
          onChange={setDepth}
          label="Shallow clone (--depth 1)"
        />
      </div>
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm} disabled={!url.trim()}>Clone</ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
