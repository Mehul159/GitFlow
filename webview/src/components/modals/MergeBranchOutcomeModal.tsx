import { BaseModal, ModalButton, ModalActions } from "./BaseModal";

export function MergeBranchOutcomeModal(props: {
  isOpen: boolean;
  status: "conflict" | "error";
  message?: string;
  conflictFiles?: string[];
  api: { postMessage: (m: unknown) => void } | null;
  onClose: () => void;
}) {
  const isConflict = props.status === "conflict";

  return (
    <BaseModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={isConflict ? "Merge needs your attention" : "Merge could not finish"}
      size="md"
    >
      {props.message ? (
        <pre className="mb-4 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-neutral-700 bg-neutral-950/80 p-3 font-mono text-xs text-neutral-300">
          {props.message}
        </pre>
      ) : null}

      {isConflict && props.conflictFiles && props.conflictFiles.length > 0 ? (
        <div className="mb-4">
          <div className="mb-2 text-sm font-medium text-neutral-300">
            Conflicted files
          </div>
          <ul className="max-h-48 space-y-1 overflow-auto rounded-lg border border-neutral-700 bg-neutral-950/60 p-2">
            {props.conflictFiles.map((f) => (
              <li key={f}>
                <button
                  type="button"
                  className="w-full truncate rounded px-2 py-1 text-left font-mono text-xs text-orange-300 hover:bg-neutral-800"
                  title={f}
                  onClick={() =>
                    props.api?.postMessage({ type: "openInEditor", path: f })
                  }
                >
                  {f}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-neutral-400">
            Resolve conflicts in your editor, then commit the merge or use{" "}
            <strong>Abort merge</strong> in the toolbar banner.
          </p>
        </div>
      ) : null}

      {!isConflict ? (
        <p className="mb-4 text-sm text-neutral-400">
          Fix the issue (e.g. stash or commit local changes, fix the branch
          name), then try again from the canvas or the Merge button.
        </p>
      ) : null}

      <ModalActions>
        <ModalButton onClick={props.onClose} variant="primary">
          OK
        </ModalButton>
      </ModalActions>
    </BaseModal>
  );
}
