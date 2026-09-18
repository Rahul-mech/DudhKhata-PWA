import { Link } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ActionSheet({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        className="scrim-enter absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="sheet-enter relative z-10 w-full max-w-lg rounded-t-2xl bg-[var(--card)] px-4 pb-6 pt-3 shadow-xl bottom-nav-safe">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border)]" />
        <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">Add</p>
        <div className="space-y-2">
          <Link
            to="/entry"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3.5 text-sm font-medium hover:bg-[var(--muted)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-sm text-white">
              M
            </span>
            <span>
              <span className="block">Milk Entry</span>
              <span className="text-xs font-normal text-[var(--muted-foreground)]">
                Morning / evening litres & fat
              </span>
            </span>
          </Link>
          <Link
            to="/extra"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-4 py-3.5 text-sm font-medium hover:bg-[var(--muted)]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--collect)] text-sm text-white">
              Rs
            </span>
            <span>
              <span className="block">Payment / Advance</span>
              <span className="text-xs font-normal text-[var(--muted-foreground)]">
                Advance, ghee, other adjustment
              </span>
            </span>
          </Link>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-[var(--border)] py-3 text-sm font-medium text-[var(--muted-foreground)]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
