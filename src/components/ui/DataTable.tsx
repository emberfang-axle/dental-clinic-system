/**
 * Reusable paginated data table — latest rows first by default.
 */

import { useMemo, useState, type ReactNode } from "react";
import { Button } from "./index";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  pageSize?: number;
  emptyMessage?: string;
  /** Sort rows before pagination (default: none — pass sorted rows in) */
  sortCompare?: (a: T, b: T) => number;
  onRowClick?: (row: T) => void;
  selectedKey?: string;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  pageSize = 10,
  emptyMessage = "No records found.",
  sortCompare,
  onRowClick,
  selectedKey,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortCompare) return rows;
    return [...rows].sort(sortCompare);
  }, [rows, sortCompare]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="glass-strong rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="border-b border-gold-500/15 bg-ink-900/60 sticky top-0">
            <tr className="text-left text-[10px] uppercase tracking-wider text-gold-300/60">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gold-100/40">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row) => {
                const key = rowKey(row);
                const selected = selectedKey === key;
                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-gold-500/10 transition ${
                      onRowClick ? "cursor-pointer hover:bg-gold-500/5" : ""
                    } ${selected ? "bg-gold-500/10" : ""}`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gold-500/15 bg-ink-900/40"
          role="navigation"
          aria-label="Table pagination"
        >
          <span className="text-xs text-gold-100/50">
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              ← Prev
            </Button>
            <span className="text-xs text-gold-100/50 min-w-[4rem] text-center">
              {safePage} / {totalPages}
            </span>
            <Button size="sm" variant="ghost" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
              Next →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { sortAppointmentsLatestFirst } from "../../shared/helpers";

/** Latest appointments first (new booking at top of table). */
export const sortByLatest = sortAppointmentsLatestFirst as (
  a: { createdAt?: string; date?: string; time?: string },
  b: { createdAt?: string; date?: string; time?: string },
) => number;

export { sortAppointmentsLatestFirst };
