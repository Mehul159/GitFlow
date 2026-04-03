import { useState } from "react";
import {
  BaseModal,
  ModalButton,
  ModalCheckbox,
  ModalActions,
} from "./BaseModal";

export function BranchMergeConnectModal(props: {
  isOpen: boolean;
  from: string;
  into: string;
  fromRemote: boolean;
  intoRemote: boolean;
  workingTreeDirty: boolean;
  onConfirm: (squash: boolean, noFf: boolean) => void;
  onClose: () => void;
}) {
  const [squash, setSquash] = useState(false);
  const [noFf, setNoFf] = useState(false);

  const blockedIntoRemote = props.intoRemote;

  const handleClose = () => {
    setSquash(false);
    setNoFf(false);
    props.onClose();
  };

  const handleConfirm = () => {
    if (blockedIntoRemote) {
      return;
    }
    props.onConfirm(squash, noFf);
    setSquash(false);
    setNoFf(false);
    props.onClose();
  };

  return (
    <BaseModal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="Merge branches"
      size="md"
    >
      <p className="mb-3 text-sm text-neutral-400">
        Merge <span className="font-mono text-orange-300">{props.from}</span>{" "}
        <span className="text-neutral-500">into</span>{" "}
        <span className="font-mono text-orange-300">{props.into}</span>
        {props.fromRemote ? (
          <span className="ml-1 text-xs text-neutral-500">(remote ref)</span>
        ) : null}
      </p>

      {blockedIntoRemote ? (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Merging into a remote-tracking card is not supported. Merge into a{" "}
          <strong>local</strong> branch: drag onto a solid (non-dashed) branch
          card, or create a local branch from the remote first.
        </div>
      ) : null}

      {props.workingTreeDirty ? (
        <div className="mb-4 rounded-lg border border-sky-500/35 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">
          You have unstaged or staged changes. Checkout may fail until you{" "}
          <strong>commit</strong>, <strong>stash</strong>, or discard changes.
        </div>
      ) : null}

      <div className="mb-2 space-y-2">
        <ModalCheckbox
          checked={squash}
          disabled={blockedIntoRemote}
          onChange={(checked) => {
            setSquash(checked);
            if (checked) {
              setNoFf(false);
            }
          }}
          label="Squash merge (staged for commit)"
        />
        {!squash && (
          <ModalCheckbox
            checked={noFf}
            disabled={blockedIntoRemote}
            onChange={setNoFf}
            label="Create merge commit even if fast-forward (--no-ff)"
          />
        )}
      </div>

      <ModalActions>
        <ModalButton onClick={handleClose} variant="secondary">
          Cancel
        </ModalButton>
        <ModalButton
          onClick={handleConfirm}
          disabled={blockedIntoRemote}
        >
          Merge
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
