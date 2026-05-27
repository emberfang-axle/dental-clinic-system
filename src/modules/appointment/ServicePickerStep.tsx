/**
 * Patient booking — Step 1 service selection with search, categories, and cart summary.
 */

import { useMemo, useState } from "react";
import { Input } from "../../components/ui";
import {
  categoriseServices,
  formatDurationMinutes,
  formatServicePrice,
  estimateBookingMinutes,
  isOralConsultation,
  POPULAR_SERVICE_NAMES,
} from "../../shared/serviceCatalog";
import type { Service } from "../../shared/types";

const NO_CONSULT_REQUIRED = new Set(["oral consultation"]);

export function serviceRequiresConsultation(service: Service): boolean {
  return !NO_CONSULT_REQUIRED.has(service.name.toLowerCase());
}

type Props = {
  services: Service[];
  selectedIds: string[];
  hasConsultation: boolean;
  onToggle: (service: Service) => void;
  onClearSelection: () => void;
  onSetSelection: (ids: string[]) => void;
  onConsultRequired: (serviceName: string) => void;
  onBookConsultation: () => void;
};

export function ServicePickerStep({
  services,
  selectedIds,
  hasConsultation,
  onToggle,
  onClearSelection,
  onSetSelection,
  onConsultRequired,
  onBookConsultation,
}: Props) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categorised = useMemo(() => categoriseServices(services), [services]);
  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.includes(s.id)),
    [services, selectedIds],
  );
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalMinutes = estimateBookingMinutes(selectedServices);

  const popularServices = useMemo(() => {
    const byName = new Map(services.map((s) => [s.name.toLowerCase(), s]));
    return POPULAR_SERVICE_NAMES.map((n) => byName.get(n.toLowerCase())).filter(
      (s): s is Service => Boolean(s),
    );
  }, [services]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: Service) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      formatServicePrice(s).toLowerCase().includes(q);

    return categorised
      .filter((cat) => categoryFilter === "all" || cat.label === categoryFilter)
      .map((cat) => ({ ...cat, items: cat.items.filter(match) }))
      .filter((cat) => cat.items.length > 0);
  }, [categorised, categoryFilter, query]);

  const categoryTabs = useMemo(
    () => ["all", ...categorised.map((c) => c.label)],
    [categorised],
  );

  function isLocked(s: Service) {
    return serviceRequiresConsultation(s) && !hasConsultation;
  }

  const bookableServices = useMemo(
    () => services.filter((s) => !isLocked(s)),
    [services, hasConsultation],
  );

  const visibleBookableIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cat of filteredCategories) {
      for (const s of cat.items) {
        if (!isLocked(s)) ids.add(s.id);
      }
    }
    return [...ids];
  }, [filteredCategories, hasConsultation]);

  const allBookableSelected =
    bookableServices.length > 0 &&
    bookableServices.every((s) => selectedIds.includes(s.id));

  const allVisibleSelected =
    visibleBookableIds.length > 0 &&
    visibleBookableIds.every((id) => selectedIds.includes(id));

  function selectIds(ids: string[]) {
    const unique = [...new Set([...selectedIds, ...ids])];
    onSetSelection(unique);
  }

  function selectAllBookable() {
    onSetSelection(bookableServices.map((s) => s.id));
  }

  function selectAllVisible() {
    selectIds(visibleBookableIds);
  }

  function handleClick(s: Service) {
    if (isLocked(s)) {
      onConsultRequired(s.name);
      return;
    }
    onToggle(s);
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="font-serif text-2xl text-gold-shine mb-1">Select a Service</h3>
        <p className="text-sm text-gold-100/50">
          Search or browse by category. You may add more than one treatment in a single visit.
        </p>
      </div>

      {!hasConsultation && (
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 text-sm text-amber-100/90 leading-relaxed">
            <span className="font-semibold text-amber-200">First visit?</span> Most treatments need an{" "}
            <span className="text-amber-300 font-medium">Oral Consultation</span> first so the dentist can
            examine you and recommend the right procedure.
          </div>
          <button
            type="button"
            onClick={onBookConsultation}
            className="shrink-0 text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 transition"
          >
            Book consultation
          </button>
        </div>
      )}

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-100/40 pointer-events-none" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <Input
          type="search"
          placeholder="Search services (e.g. cleaning, braces, extraction…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          aria-label="Search dental services"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 flex-1">
        {categoryTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setCategoryFilter(tab)}
            className={`text-[10px] uppercase tracking-wider font-semibold px-3 py-1.5 rounded-full border transition ${
              categoryFilter === tab
                ? "bg-gold-gradient text-ink-950 border-gold-300"
                : "border-gold-500/25 text-gold-100/60 hover:border-gold-400/50 hover:text-gold-200"
            }`}
          >
            {tab === "all" ? "All" : tab}
          </button>
        ))}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {query || categoryFilter !== "all" ? (
            <button
              type="button"
              disabled={visibleBookableIds.length === 0}
              onClick={() => (allVisibleSelected ? onClearSelection() : selectAllVisible())}
              className="text-[10px] uppercase tracking-wider font-semibold px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-300 hover:border-gold-400/50 disabled:opacity-40 transition"
            >
              {allVisibleSelected ? "Deselect shown" : "Select shown"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={bookableServices.length === 0}
            onClick={() => (allBookableSelected ? onClearSelection() : selectAllBookable())}
            className="text-[10px] uppercase tracking-wider font-semibold px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-300 hover:border-gold-400/50 disabled:opacity-40 transition"
          >
            {allBookableSelected ? "Deselect all" : "Select all"}
          </button>
        </div>
      </div>

      {!query && categoryFilter === "all" && popularServices.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold-400/70 font-semibold mb-2">
            Popular choices
          </p>
          <div className="flex flex-wrap gap-2">
            {popularServices.map((s) => {
              const locked = isLocked(s);
              const selected = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleClick(s)}
                  className={`text-left text-xs px-3 py-2 rounded-lg border transition max-w-full ${
                    selected
                      ? "border-gold-400 bg-gold-500/15 text-gold-100"
                      : locked
                        ? "border-amber-500/30 text-amber-200/80 hover:border-amber-400/50"
                        : "border-gold-500/25 text-gold-100/80 hover:border-gold-400/50"
                  }`}
                >
                  {selected && <span className="text-gold-400 mr-1">✓</span>}
                  {s.name}
                  <span className="text-gold-300/70 ml-1 font-mono">{formatServicePrice(s)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {filteredCategories.length === 0 ? (
        <p className="text-center text-sm text-gold-100/50 py-8">
          No services match your search. Try another keyword or clear filters.
        </p>
      ) : (
        filteredCategories.map((cat) => {
          const catBookable = cat.items.filter((s) => !isLocked(s));
          const catAllSelected =
            catBookable.length > 0 && catBookable.every((s) => selectedIds.includes(s.id));
          return (
          <div key={cat.label}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-gold-400/70 font-semibold">
                {cat.label}
              </p>
              {catBookable.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (catAllSelected) {
                      onSetSelection(selectedIds.filter((id) => !catBookable.some((s) => s.id === id)));
                    } else {
                      selectIds(catBookable.map((s) => s.id));
                    }
                  }}
                  className="text-[10px] text-gold-400/70 hover:text-gold-300 uppercase tracking-wider"
                >
                  {catAllSelected ? "Clear category" : "Select category"}
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {cat.items.map((s) => (
                <ServiceCard
                  key={s.id}
                  service={s}
                  selected={selectedIds.includes(s.id)}
                  locked={isLocked(s)}
                  expanded={expandedId === s.id}
                  onExpand={() => setExpandedId((id) => (id === s.id ? null : s.id))}
                  onSelect={() => handleClick(s)}
                />
              ))}
            </div>
          </div>
          );
        })
      )}

      {selectedServices.length > 0 && (
        <div className="sticky bottom-0 z-10 rounded-xl border border-gold-400/40 bg-ink-900/95 backdrop-blur-md p-4 shadow-luxe">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-xs uppercase tracking-wider text-gold-300 font-semibold">
              Your selection ({selectedServices.length})
            </p>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-[10px] text-gold-100/50 hover:text-gold-200 uppercase tracking-wider"
            >
              Clear all
            </button>
          </div>
          <ul className="space-y-2 max-h-36 overflow-y-auto pr-1">
            {selectedServices.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-2 text-sm border-b border-gold-500/10 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-gold-100 font-medium leading-snug">{s.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-gold-300 font-mono text-xs">{formatServicePrice(s)}</span>
                  <button
                    type="button"
                    onClick={() => onToggle(s)}
                    className="text-gold-100/40 hover:text-red-300 text-xs px-1"
                    aria-label={`Remove ${s.name}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-gold-500/20 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-gold-100/60">
              Est. visit time:{" "}
              <span className="text-gold-200 font-medium">{formatDurationMinutes(totalMinutes)}</span>
            </span>
            <span className="text-gold-300 font-semibold font-mono">
              From ₱{totalPrice.toLocaleString("en-PH")}
              {selectedServices.some((s) => s.priceMax) && (
                <span className="text-gold-100/50 font-normal text-xs ml-1">(final price at clinic)</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  service: s,
  selected,
  locked,
  expanded,
  onExpand,
  onSelect,
}: {
  service: Service;
  selected: boolean;
  locked: boolean;
  expanded: boolean;
  onExpand: () => void;
  onSelect: () => void;
}) {
  const showFullDesc = expanded || s.description.length <= 72;

  return (
    <div
      className={`rounded-xl border transition text-left ${
        selected
          ? "border-gold-400 bg-gold-500/10 ring-1 ring-gold-400/30"
          : locked
            ? "border-gold-500/15 bg-ink-900/40"
            : "border-gold-500/20 hover:border-gold-400/50 bg-ink-900/20"
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-gold-100 flex items-start gap-2 leading-snug">
            <span
              className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 text-xs ${
                selected ? "bg-gold-gradient border-gold-300 text-ink-950" : "border-gold-500/40"
              }`}
            >
              {selected ? "✓" : ""}
            </span>
            <span>
              {s.name}
              {s.requiresDeposit && (
                <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-gold-500/15 border border-gold-500/30 text-gold-300 font-semibold uppercase tracking-wider align-middle">
                  Deposit may apply
                </span>
              )}
              {locked && (
                <span className="block mt-1 text-[10px] px-1.5 py-0.5 rounded w-fit bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold uppercase tracking-wider">
                  Consultation first
                </span>
              )}
            </span>
          </span>
          <span className="text-gold-300 font-mono text-sm whitespace-nowrap shrink-0">
            {formatServicePrice(s)}
          </span>
        </div>
        <div className="text-xs text-gold-100/50 mt-2 ml-7">{s.duration} min</div>
      </button>
      <div className="px-4 pb-3 ml-7 -mt-1">
        <p className={`text-xs text-gold-100/55 leading-relaxed ${showFullDesc ? "" : "line-clamp-2"}`}>
          {s.description}
        </p>
        {s.description.length > 72 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="text-[10px] text-gold-400/80 hover:text-gold-300 mt-1 font-semibold uppercase tracking-wider"
          >
            {expanded ? "Show less" : "Learn more"}
          </button>
        )}
        {locked && isOralConsultation(s.name) === false && (
          <p className="mt-2 text-xs text-amber-200/70">
            Tap to see how to book a consultation first.
          </p>
        )}
      </div>
    </div>
  );
}
