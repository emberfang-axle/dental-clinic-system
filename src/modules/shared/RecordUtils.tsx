export function ImagePreview({ title, src }: { title: string; src?: string }) {
  return (
    <div className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-gold-300/55 mb-3">{title}</div>
      {src ? (
        <img 
          src={src} 
          alt={title} 
          className="w-full h-48 object-cover rounded-xl border border-gold-500/10" 
        />
      ) : (
        <div className="h-48 rounded-xl border border-dashed border-gold-500/20 bg-ink-950/50 flex items-center justify-center text-sm text-gold-100/40">
          No image added yet
        </div>
      )}
    </div>
  );
}

/* ─────────── RECORD BLOCK UTILITY ─────────── */

export function RecordBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4">
      <div className="text-[10px] uppercase tracking-[0.24em] text-gold-300/55">{title}</div>
      <p className="mt-2 text-sm text-gold-100/70 leading-relaxed">{value}</p>
    </div>
  );
}

