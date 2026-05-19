import { useState } from "react";
import { Card, Input, Select } from "../../components/ui";
import { useStore } from "../../store/store";
import { formatDateTime } from "../../shared/helpers";
import type { AuditLog } from "../../shared/types";

function actionBadge(action: string) {
  if (action.toLowerCase().includes("added") || action.toLowerCase().includes("created")) {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  }
  if (action.toLowerCase().includes("updated") || action.toLowerCase().includes("edited")) {
    return "bg-blue-500/15 text-blue-300 border-blue-500/30";
  }
  if (action.toLowerCase().includes("deleted") || action.toLowerCase().includes("removed")) {
    return "bg-red-500/15 text-red-300 border-red-500/30";
  }
  return "bg-gold-500/10 text-gold-300 border-gold-500/25";
}

export function AuditLogsPage() {
  const { logs } = useStore() as { logs: AuditLog[] };
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const actionTypes = Array.from(new Set(logs.map((l) => l.action))).sort();

  const filtered = logs.filter((l) => {
    const matchSearch = !search || `${l.actor}${l.action}${l.target}`.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === "all" || l.action === filterAction;
    return matchSearch && matchAction;
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Stats */}
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
            {logs.filter((l) => l.at.startsWith(today)).length}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-gold-100/50 mt-1">Today</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="!p-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search by actor, action, or target…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <Select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="w-52">
          <option value="all">All Actions</option>
          {actionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
      </Card>

      {/* Log entries */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card><p className="text-sm text-gold-100/50 text-center py-4">No audit logs found.</p></Card>
        )}
        {filtered.map((l) => (
          <div key={l.id} className="glass rounded-xl px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {/* Who · What · Where */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gold-100">{l.actor}</span>
                  <span className="text-gold-300/40 text-xs">performed</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${actionBadge(l.action)}`}>
                    {l.action}
                  </span>
                </div>
                {/* Target / location */}
                <div className="text-xs text-gold-100/45 mt-1 leading-relaxed">
                  <span className="text-gold-300/50">on </span>{l.target}
                </div>
              </div>
              {/* When */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-gold-100/40">{formatDateTime(l.at)}</div>
                </div>
                {(l.before || l.after) && (
                  <button
                    onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                    className="text-[10px] text-gold-400/60 hover:text-gold-300 transition border border-gold-500/20 rounded px-2 py-0.5">
                    {expanded === l.id ? "Hide" : "Changes"}
                  </button>
                )}
              </div>
            </div>

            {/* Before / After diff */}
            {expanded === l.id && (l.before || l.after) && (
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                {l.before && (
                  <div className="rounded-lg bg-red-500/8 border border-red-500/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-red-400/70 mb-2">Before</div>
                    {Object.entries(l.before).filter(([, v]) => String(v).trim()).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs gap-2 py-0.5 border-b border-red-500/10 last:border-0">
                        <span className="text-gold-100/50 capitalize">{k}</span>
                        <span className="text-red-300/80 font-mono text-right max-w-[60%] truncate">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {l.after && (
                  <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 p-3">
                    <div className="text-[9px] uppercase tracking-wider text-emerald-400/70 mb-2">After</div>
                    {Object.entries(l.after).filter(([, v]) => String(v).trim()).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs gap-2 py-0.5 border-b border-emerald-500/10 last:border-0">
                        <span className="text-gold-100/50 capitalize">{k}</span>
                        <span className="text-emerald-300/80 font-mono text-right max-w-[60%] truncate">{String(v)}</span>
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
