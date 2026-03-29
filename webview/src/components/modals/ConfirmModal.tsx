import { BaseModal, ModalButton, ModalActions } from "./BaseModal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger" | "warning";
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = "Confirm", 
  cancelLabel = "Cancel",
  variant = "default" 
}: ConfirmModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="mb-4 text-sm text-neutral-400">{message}</p>
      <ModalActions>
        <ModalButton onClick={onClose} variant="secondary">{cancelLabel}</ModalButton>
        <ModalButton onClick={onConfirm} variant={variant === "danger" ? "danger" : variant === "warning" ? "warning" : "primary"}>
          {confirmLabel}
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
