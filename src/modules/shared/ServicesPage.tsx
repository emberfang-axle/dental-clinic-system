import { useCallback, useState } from "react";
import { Button, Input, Card } from "../../components/ui";
import { catalogService } from "../../services/catalog";
import { useStore } from "../../store/store";
import type { Role, Service } from "../../shared/types";

const CATEGORIES: { label: string; names: string[] }[] = [
  { label: "Preventive Care",        names: ["Oral Consultation", "Oral Prophylaxis (Cleaning)", "Teeth Whitening", "Fluoride Application & Sealants"] },
  { label: "Restorative Treatments", names: ["Tooth Filling (Pasta)", "Root Canal Treatment", "Dental Crowns", "Porcelain Crowns", "Zirconia Crowns", "Crowns and Bridges", "Fixed Bridge", "Veneers"] },
  { label: "Orthodontics",           names: ["Orthodontics (Braces)", "Braces Adjustment", "Retainers"] },
  { label: "Prosthodontics",         names: ["Dentures", "Removable Dentures", "Ivocap Dentures"] },
  { label: "Surgical / Emergency",   names: ["Tooth Extraction (Bunot)", "Odontectomy (3rd Molar Removal)", "Emergency Dental Services"] },
];

function fmtPrice(s: Service) {
  const lo = `₱${s.price.toLocaleString("en-PH")}`;
  return s.priceMax ? `${lo} – ₱${s.priceMax.toLocaleString("en-PH")}` : lo;
}

const EMPTY_FORM = { name: "", price: "", priceMax: "", duration: "", description: "" };

export function ServicesPage({ role }: { role: Role }) {
  const { services, user } = useStore() as {
    services: Service[];
    user: { id: string; name: string; role: Role } | null;
  };

  const canEdit = role === "doctor" || role === "admin";

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const unique = services.filter(
    (s, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase()) === i
  );

  const categorised = CATEGORIES.map((cat) => ({
    label: cat.label,
    items: unique.filter((s) => cat.names.some((n) => n.toLowerCase() === s.name.toLowerCase())),
  })).filter((c) => c.items.length > 0);

  const categorisedNames = new Set(CATEGORIES.flatMap((c) => c.names.map((n) => n.toLowerCase())));
  const other = unique.filter((s) => !categorisedNames.has(s.name.toLowerCase()));
  if (other.length > 0) categorised.push({ label: "Other", items: other });

  const handlePriceChange = useCallback((serviceId: string, newPrice: number) => {
    if (canEdit && user) catalogService.update(serviceId, { price: newPrice });
  }, [canEdit, user]);

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

  return (
    <div className="space-y-6">

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative glass-strong rounded-2xl p-6 max-w-sm w-full shadow-luxe space-y-4 text-center">
            <h3 className="font-serif text-xl text-gold-shine">Delete this service?</h3>
            <p className="text-sm text-gold-100/60">This cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="danger" onClick={() => handleDelete(confirmDelete)}>Yes, Delete</Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {categorised.map((cat) => (
        <div key={cat.label}>
          <p className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55 mb-2">{cat.label}</p>
          <div className="overflow-x-auto rounded-xl border border-gold-500/20">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold-500/20 bg-gold-500/5">
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gold-300/70 font-semibold">Procedure</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gold-300/70 font-semibold">Duration</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gold-300/70 font-semibold hidden md:table-cell">Description</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-gold-300/70 font-semibold">Price</th>
                  {canEdit && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {cat.items.map((s, i) => (
                  <tr key={s.id} className={`border-b border-gold-500/10 transition hover:bg-gold-500/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                    <td className="px-4 py-3 font-medium text-gold-100">{s.name}</td>
                    <td className="px-4 py-3 text-gold-100/60 whitespace-nowrap">{s.duration} min</td>
                    <td className="px-4 py-3 text-gold-100/60 leading-relaxed hidden md:table-cell">{s.description}</td>
                    <td className="px-4 py-3 text-right">
                      {canEdit ? (
                        <Input
                          type="number"
                          defaultValue={s.price}
                          onBlur={(e) => {
                            const n = Number(e.target.value);
                            if (n > 0 && n !== s.price) handlePriceChange(s.id, n);
                          }}
                          className="font-mono w-28 text-right ml-auto mr-2"
                        />
                      ) : (
                        <span className="font-mono text-gold-300 whitespace-nowrap">{fmtPrice(s)}</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setConfirmDelete(s.id)}
                          className="text-gold-100/25 hover:text-red-400 transition text-base"
                          aria-label={`Delete ${s.name}`}
                        >
                          ✕
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Add new service */}
      {canEdit && (
        <Card>
          {!adding ? (
            <button
              onClick={() => setAdding(true)}
              className="text-sm text-gold-300 hover:text-gold-100 transition"
            >
              + Add New Service
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-gold-300/60">New Service</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input placeholder="Service name *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                <Input placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                <Input type="number" placeholder="Price (₱) *" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
                <Input type="number" placeholder="Max Price (₱) — optional" value={form.priceMax} onChange={(e) => setForm((p) => ({ ...p, priceMax: e.target.value }))} />
                <Input type="number" placeholder="Duration (minutes) *" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={saving || !form.name || !form.price || !form.duration} onClick={handleAdd}>
                  {saving ? "Saving…" : "Save Service"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setForm(EMPTY_FORM); }}>Cancel</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
