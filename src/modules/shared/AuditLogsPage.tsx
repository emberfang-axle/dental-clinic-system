import { useState } from "react";
import { Card, Input } from "../../components/ui";
import { useStore } from "../../store/store";
import { formatDateTime } from "../../shared/helpers";
import type { AuditLog } from "../../shared/types";

export function AuditLogsPage() {
  const { logs } = useStore() as { logs: AuditLog[] };
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = logs.filter((l) =>
    !search || `${l.actor}${l.action}${l.target}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="!p-4 text-center">
          <div className="text-2xl font-serif text-gold-gradient">{logs.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-gold-100/50 mt-1">Total Events</div>
        </Card>
        <Card className="!p-4 text-center">
          <div className="text-2xl font-serif text-gold-gradient">{new Set(logs.map((l) => l.actor)).size}</div>
          <div className="text-[10px] uppercase tracking-wider text-gold-100/50 mt-1">Unique Actors</div>
        </Card>
        <Card className="!p-4 text-center">
          <div className="text-2xl font-serif text-gold-gradient">
            {logs.filter((l) => l.at.startsWith(new Date().toISOString().slice(0, 10))).length}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-gold-100/50 mt-1">Today</div>
        </Card>
      </div>

      <Card className="!p-4">
        <Input placeholder="Search by actor, action, or target…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card><p className="text-sm text-gold-100/50 text-center py-4">No audit logs found.</p></Card>
        )}
        {filtered.map((l) => (
          <div key={l.id} className="glass rounded-xl px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gold-100">{l.actor}</span>
                  <span className="text-xs text-gold-300/60">→</span>
                  <span className="text-sm text-gold-100/80">{l.action}</span>
                </div>
                <div className="text-xs text-gold-100/45 mt-0.5 truncate">{l.target}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-[10px] text-gold-100/40">{formatDateTime(l.at)}</div>
                {(l.before || l.after) && (
                  <button onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                    className="text-[10px] text-gold-400/60 hover:text-gold-300 transition border border-gold-500/20 rounded px-2 py-0.5">
                    {expanded === l.id ? "Hide" : "Changes"}
                  </button>
                )}
              </div>
            </div>

            {expanded === l.id && (l.before || l.after) && (
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                {l.before && (
                  <div className="rounded-lg bg-red-500/8 border border-red-500/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-red-400/70 mb-2">Before</div>
                    {Object.entries(l.before).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs gap-2">
                        <span className="text-gold-100/50">{k}</span>
                        <span className="text-red-300/80 font-mono">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {l.after && (
                  <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-emerald-400/70 mb-2">After</div>
                    {Object.entries(l.after).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs gap-2">
                        <span className="text-gold-100/50">{k}</span>
                        <span className="text-emerald-300/80 font-mono">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
