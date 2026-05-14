import { useCallback } from "react";
import { Input } from "../../components/ui";
import { catalogService } from "../../services/catalog";
import { useStore } from "../../store/store";
import type { Role, Service } from "../../shared/types";

const CATEGORIES: { label: string; names: string[] }[] = [
  { label: "Preventive Care",        names: ["Oral Consultation", "Oral Prophylaxis (Cleaning)", "Teeth Whitening"] },
  { label: "Restorative Treatments", names: ["Tooth Filling (Pasta)", "Root Canal Treatment", "Dental Crowns", "Crowns and Bridges", "Fixed Bridge", "Veneers"] },
  { label: "Orthodontics",           names: ["Orthodontics (Braces)", "Braces Adjustment"] },
  { label: "Prosthodontics",         names: ["Dentures", "Removable Dentures", "Ivocap Dentures"] },
  { label: "Surgical / Emergency",   names: ["Tooth Extraction (Bunot)", "Odontectomy (3rd Molar Removal)", "Emergency Dental Services"] },
];

function fmtPrice(s: Service) {
  const lo = `₱${s.price.toLocaleString("en-PH")}`;
  return s.priceMax ? `${lo} – ₱${s.priceMax.toLocaleString("en-PH")}` : lo;
}

export function ServicesPage({ role }: { role: Role }) {
  const { services, user } = useStore() as {
    services: Service[];
    user: { id: string; name: string; role: Role } | null;
  };

  const canEdit = role === "doctor" || role === "admin";

  const unique = services.filter(
    (s, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase()) === i
  );

  // Map services into categories; uncategorised go to "Other"
  const categorised = CATEGORIES.map((cat) => ({
    label: cat.label,
    items: unique.filter((s) => cat.names.some((n) => n.toLowerCase() === s.name.toLowerCase())),
  })).filter((c) => c.items.length > 0);

  const categorisedNames = new Set(CATEGORIES.flatMap((c) => c.names.map((n) => n.toLowerCase())));
  const other = unique.filter((s) => !categorisedNames.has(s.name.toLowerCase()));
  if (other.length > 0) categorised.push({ label: "Other", items: other });

  const handlePriceChange = useCallback((serviceId: string, newPrice: number) => {
    if (canEdit && user) catalogService.setPrice(serviceId, newPrice);
  }, [canEdit, user]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 text-xs text-amber-200/80 leading-relaxed">
        <span className="font-semibold text-amber-300">Downpayment Policy: </span>
        Procedures marked <span className="text-amber-300 font-medium">Deposit Required</span> require a minimum 30–50% downpayment to confirm. The remaining balance is settled during or after treatment.
      </div>

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
                </tr>
              </thead>
              <tbody>
                {cat.items.map((s, i) => (
                  <tr key={s.id} className={`border-b border-gold-500/10 transition hover:bg-gold-500/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                    <td className="px-4 py-3 font-medium text-gold-100">
                      <div>{s.name}</div>
                      {s.requiresDeposit && (
                        <span className="mt-1 inline-block text-[10px] uppercase tracking-wider font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded px-1.5 py-0.5">
                          Deposit Required
                        </span>
                      )}
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
