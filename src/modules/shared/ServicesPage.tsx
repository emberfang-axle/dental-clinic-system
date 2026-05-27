import { useCallback, useMemo, useState } from "react";
import { Button, Input, Card } from "../../components/ui";
import { DataTable } from "../../components/ui/DataTable";
import { catalogService } from "../../services/catalog";
import { useStore } from "../../store/store";
import { categoriseServices, formatServicePrice } from "../../shared/serviceCatalog";
import type { Role, Service } from "../../shared/types";

const EMPTY_FORM = { name: "", price: "", priceMax: "", duration: "", description: "" };

export function ServicesPage({ role }: { role: Role }) {
  const { services, user } = useStore() as {
    services: Service[];
    user: { id: string; name: string; role: Role } | null;
  };

  const canEdit = role === "doctor" || role === "admin";
  const [view, setView] = useState<"table" | "cards">("table");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = services.filter(
      (s, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase()) === i,
    );
    if (!q) return list.sort((a, b) => a.name.localeCompare(b.name));
    return list
      .filter((s) => `${s.name} ${s.description}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [services, search]);

  const categorised = useMemo(() => categoriseServices(services), [services]);

  const handlePriceChange = useCallback(
    (serviceId: string, newPrice: number) => {
      if (canEdit && user) catalogService.update(serviceId, { price: newPrice });
    },
    [canEdit, user],
  );

  async function handleAdd() {
    if (!form.name.trim() || !form.price || !form.duration) return;
    setSaving(true);
    try {
      await catalogService.add({
        name: form.name.trim(),
        price: Number(form.price),
        priceMax: form.priceMax ? Number(form.priceMax) : undefined,
        duration: Number(form.duration),
        description: form.description.trim(),
      });
      setForm(EMPTY_FORM);
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await catalogService.remove(id);
    setConfirmDelete(null);
  }

  const tableColumns = [
    {
      key: "name",
      header: "Procedure",
      render: (s: Service) => <span className="font-medium text-gold-100">{s.name}</span>,
    },
    {
      key: "price",
      header: "Price (₱)",
      render: (s: Service) =>
        canEdit ? (
          <input
            type="number"
            defaultValue={s.price}
            className="w-24 rounded bg-ink-900/60 border border-gold-500/20 px-2 py-1 text-sm text-gold-100"
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (v > 0 && v !== s.price) handlePriceChange(s.id, v);
            }}
          />
        ) : (
          <span className="font-mono text-gold-300">{formatServicePrice(s)}</span>
        ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (s: Service) => <span className="text-gold-100/70">{s.duration} min</span>,
    },
    {
      key: "desc",
      header: "Description",
      render: (s: Service) => (
        <span className="text-xs text-gold-100/55 line-clamp-2 max-w-md">{s.description}</span>
      ),
    },
    ...(canEdit
      ? [
          {
            key: "actions",
            header: "",
            render: (s: Service) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(s.id);
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-gold-shine">Service Catalog</h2>
          <p className="text-xs text-gold-100/50 mt-1">
            Official clinic pricing — used by appointment and billing modules (thesis scope).
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={view === "table" ? "primary" : "ghost"} onClick={() => setView("table")}>
            Table
          </Button>
          <Button size="sm" variant={view === "cards" ? "primary" : "ghost"} onClick={() => setView("cards")}>
            By category
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => setAdding((v) => !v)}>
              {adding ? "Cancel" : "+ Add Service"}
            </Button>
          )}
        </div>
      </div>

      <Input
        placeholder="Search procedures…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/60" onClick={() => setConfirmDelete(null)} />
          <Card className="relative max-w-sm w-full text-center space-y-4">
            <h3 className="font-serif text-xl text-gold-shine">Delete this service?</h3>
            <div className="flex gap-3 justify-center">
              <Button variant="danger" onClick={() => handleDelete(confirmDelete)}>
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {adding && canEdit && (
        <Card className="space-y-3">
          <p className="text-sm text-gold-100/60">Add a new procedure to the catalog.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input placeholder="Procedure name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Duration (minutes)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            <Input placeholder="Price (₱)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input placeholder="Max price (optional)" type="number" value={form.priceMax} onChange={(e) => setForm({ ...form, priceMax: e.target.value })} />
          </div>
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button disabled={saving} onClick={handleAdd}>
            {saving ? "Saving…" : "Save Service"}
          </Button>
        </Card>
      )}

      {view === "table" ? (
        <DataTable
          columns={tableColumns}
          rows={filtered}
          rowKey={(s) => s.id}
          pageSize={10}
          emptyMessage="No services match your search."
        />
      ) : (
        categorised.map((cat) => (
          <div key={cat.label}>
            <p className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55 mb-2">{cat.label}</p>
            <div className="overflow-x-auto rounded-xl border border-gold-500/20">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gold-500/20 bg-gold-500/5">
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gold-300/70">Procedure</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gold-300/70">Price</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gold-300/70">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.items.map((s) => (
                    <tr key={s.id} className="border-b border-gold-500/10">
                      <td className="px-4 py-3 text-gold-100">{s.name}</td>
                      <td className="px-4 py-3 font-mono text-gold-300">{formatServicePrice(s)}</td>
                      <td className="px-4 py-3 text-gold-100/60">{s.duration} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {!canEdit && (
        <p className="text-xs text-gold-100/40">
          Prices are set by the doctor. Patients see these rates when booking and on the public website.
        </p>
      )}
    </div>
  );
}
