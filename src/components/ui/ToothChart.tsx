/**
 * Simple FDI tooth chart (odontogram).
 * Upper: 18–11 | 21–28  Lower: 48–41 | 31–38
 */

const TOOTH_CONDITIONS = ["Healthy", "Caries", "Filled", "Missing", "Crown", "RCT", "Extraction", "Implant"] as const;
type ToothCondition = typeof TOOTH_CONDITIONS[number];

const CONDITION_COLORS: Record<ToothCondition, string> = {
  Healthy:    "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  Caries:     "bg-red-500/20 border-red-500/40 text-red-300",
  Filled:     "bg-blue-500/20 border-blue-500/40 text-blue-300",
  Missing:    "bg-ink-800 border-gold-500/20 text-gold-100/30 line-through",
  Crown:      "bg-purple-500/20 border-purple-500/40 text-purple-300",
  RCT:        "bg-amber-500/20 border-amber-500/40 text-amber-300",
  Extraction: "bg-red-900/40 border-red-700/40 text-red-400",
  Implant:    "bg-cyan-500/20 border-cyan-500/40 text-cyan-300",
};

const UPPER = [
  [18,17,16,15,14,13,12,11],
  [21,22,23,24,25,26,27,28],
];
const LOWER = [
  [48,47,46,45,44,43,42,41],
  [31,32,33,34,35,36,37,38],
];

interface ToothChartProps {
  value: Record<string, string>;
  onChange?: (updated: Record<string, string>) => void;
  readOnly?: boolean;
}

export function ToothChart({ value, onChange, readOnly = false }: ToothChartProps) {
  function getCondition(tooth: number): ToothCondition {
    return (value[String(tooth)] as ToothCondition) || "Healthy";
  }

  function cycle(tooth: number) {
    if (readOnly) return;
    const current = getCondition(tooth);
    const idx = TOOTH_CONDITIONS.indexOf(current);
    const next = TOOTH_CONDITIONS[(idx + 1) % TOOTH_CONDITIONS.length];
    onChange?.({ ...value, [String(tooth)]: next });
  }

  function ToothButton({ tooth }: { tooth: number }) {
    const cond = getCondition(tooth);
    const color = CONDITION_COLORS[cond];
    return (
      <button
        type="button"
        onClick={() => cycle(tooth)}
        disabled={readOnly}
        title={`${tooth}: ${cond}`}
        className={`w-9 h-9 rounded-lg border text-[10px] font-bold transition ${color} ${readOnly ? "cursor-default" : "hover:brightness-125"}`}
      >
        {tooth}
      </button>
    );
  }

  function Row({ teeth }: { teeth: number[] }) {
    return (
      <div className="flex gap-1 justify-center">
        {teeth.map((t) => <ToothButton key={t} tooth={t} />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-[9px] uppercase tracking-wider text-gold-300/50 text-center">Upper</p>
        <Row teeth={UPPER[0]} />
        <Row teeth={UPPER[1]} />
      </div>
      <div className="border-t border-gold-500/15" />
      <div className="space-y-1">
        <Row teeth={LOWER[0]} />
        <Row teeth={LOWER[1]} />
        <p className="text-[9px] uppercase tracking-wider text-gold-300/50 text-center">Lower</p>
      </div>
      {!readOnly && (
        <div className="flex flex-wrap gap-2 pt-1">
          {TOOTH_CONDITIONS.map((c) => (
            <span key={c} className={`text-[10px] px-2 py-0.5 rounded border ${CONDITION_COLORS[c]}`}>{c}</span>
          ))}
          <span className="text-[10px] text-gold-100/40 self-center">← click tooth to cycle</span>
        </div>
      )}
    </div>
  );
}
