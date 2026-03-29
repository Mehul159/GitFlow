import { BaseModal, ModalButton, ModalActions } from "./BaseModal";

interface PullModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rebase: boolean) => void;
}

export function PullModal({ isOpen, onClose, onConfirm }: PullModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Pull Options">
      <p className="mb-4 text-sm text-neutral-400">Choose how you want to integrate remote changes:</p>
      <ModalActions>
        <ModalButton onClick={onClose} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={() => { onConfirm(false); onClose(); }} variant="primary">
          Pull (merge)
        </ModalButton>
        <ModalButton onClick={() => { onConfirm(true); onClose(); }} variant="warning">
          Pull with Rebase
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
