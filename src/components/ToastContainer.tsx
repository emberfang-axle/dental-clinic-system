import { useStore, setState, getSnapshot } from "../store/store";

const STYLES = {
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  error:   "border-red-500/40 bg-red-500/15 text-red-300",
  info:    "border-gold-500/30 bg-gold-500/10 text-gold-200",
};

const ICONS = { success: "✓", error: "✕", info: "ℹ" };

function dismiss(id: string) {
  setState({ toasts: getSnapshot().toasts.filter((t) => t.id !== id) });
}

export function ToastContainer() {
  const { toasts } = useStore();
  if (!toasts.length) return null;

  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none items-center"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm shadow-luxe backdrop-blur-xl animate-fade-in pointer-events-auto max-w-sm ${STYLES[t.kind]}`}
        >
          <span className="font-bold shrink-0">{ICONS[t.kind]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="shrink-0 opacity-60 hover:opacity-100 transition text-base leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
