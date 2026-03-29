import { useState } from "react";
import { BaseModal, ModalInput, ModalButton, ModalActions } from "./BaseModal";

interface BisectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bad: string, good: string[]) => void;
}

export function BisectModal({ isOpen, onClose, onConfirm }: BisectModalProps) {
  const [bad, setBad] = useState("HEAD");
  const [good, setGood] = useState("");

  const handleConfirm = () => {
    if (bad.trim()) {
      const goodBranches = good.split(",").map((g) => g.trim()).filter(Boolean);
      onConfirm(bad.trim(), goodBranches);
      resetForm();
    }
  };

  const resetForm = () => {
    setBad("HEAD");
    setGood("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} title="Start Bisect">
      <p className="mb-3 text-sm text-neutral-400">
        Bisect helps you find the commit that introduced a bug by using binary search.
      </p>
      <ModalInput
        value={bad}
        onChange={setBad}
        placeholder="HEAD"
        label="Known bad commit"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && bad.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <ModalInput
        value={good}
        onChange={setGood}
        placeholder="main, develop"
        label="Known good commits (comma-separated)"
        onKeyDown={(e) => {
          if (e.key === "Enter" && bad.trim()) handleConfirm();
          if (e.key === "Escape") handleClose();
        }}
      />
      <p className="mb-4 text-xs text-neutral-500">
        After starting, use "git bisect good" and "git bisect bad" to test commits
      </p>
      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={handleConfirm} disabled={!bad.trim()}>Start Bisect</ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
