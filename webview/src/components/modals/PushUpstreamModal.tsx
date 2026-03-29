import { BaseModal, ModalButton, ModalActions } from "./BaseModal";

interface PushUpstreamModalProps {
  isOpen: boolean;
  branch: string;
  remote: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PushUpstreamModal({ isOpen, branch, remote, onConfirm, onCancel }: PushUpstreamModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onCancel} title="No Upstream Branch">
      <p className="mb-4 text-sm text-neutral-400">
        The current branch <strong className="text-white">{branch}</strong> has no upstream branch.
      </p>
      <p className="mb-4 text-sm text-neutral-400">
        Would you like to push and set <strong className="text-white">{remote}/{branch}</strong> as the upstream branch?
      </p>
      <ModalActions>
        <ModalButton onClick={onCancel} variant="secondary">Cancel</ModalButton>
        <ModalButton onClick={onConfirm}>Push with Upstream</ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
