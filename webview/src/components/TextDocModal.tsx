export function TextDocModal(props: {
  title: string;
  body: string;
  language?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gfs-doc-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          props.onClose();
        }
      }}
    >
      <div className="flex max-h-[min(88vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-gfs border border-gfs-surface2 bg-gfs-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-gfs-surface2 px-4 py-3">
          <h2 id="gfs-doc-title" className="truncate text-sm font-semibold text-gfs-text">
            {props.title}
          </h2>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-gfs-muted hover:bg-gfs-surface2 hover:text-gfs-text"
            onClick={props.onClose}
          >
            Close
          </button>
        </div>
        <pre className="gfs-scroll flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-gfs-text">
          {props.body}
        </pre>
      </div>
    </div>
  );
}
