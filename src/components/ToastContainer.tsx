import { useStore } from "../store/store";

const STYLES = {
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  error:   "border-red-500/40 bg-red-500/15 text-red-300",
  info:    "border-gold-500/30 bg-gold-500/10 text-gold-200",
};

const ICONS = { success: "✓", error: "✕", info: "ℹ" };

export function ToastContainer() {
  const { toasts } = useStore();
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm shadow-luxe backdrop-blur-xl animate-fade-in pointer-events-auto ${STYLES[t.kind]}`}
        >
          <span className="font-bold">{ICONS[t.kind]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
