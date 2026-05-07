import { useCallback } from "react";
import { Input } from "../../components/ui";
import { catalogService } from "../../services/catalog";
import { useStore } from "../../store/store";
import type { Role, Service } from "../../shared/types";

export function ServicesPage({ role }: { role: Role }) {
  const { services, user } = useStore() as {
    services: Service[];
    user: { id: string; name: string; role: Role } | null;
  };

  const canEdit = role === "doctor";

  // Deduplicate by name (case-insensitive), keep first occurrence
  const unique = services.filter(
    (s, i, arr) => arr.findIndex((x) => x.name.toLowerCase() === s.name.toLowerCase()) === i
  );

  const handlePriceChange = useCallback((serviceId: string, newPrice: number) => {
    if (canEdit && user) catalogService.setPrice(serviceId, newPrice);
  }, [canEdit, user]);

  return (
    <div className="space-y-4">
      {!canEdit && (
        <p className="text-sm text-gold-100/60">
          Only the clinic doctor can edit pricing. Staff have read-only access.
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-gold-500/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold-500/20 bg-gold-500/5">
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gold-300/70 font-semibold">Procedure</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gold-300/70 font-semibold">Duration</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gold-300/70 font-semibold">Description</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-gold-300/70 font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {unique.map((s, i) => (
              <tr key={s.id} className={`border-b border-gold-500/10 transition hover:bg-gold-500/5 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                <td className="px-4 py-3 font-medium text-gold-100">{s.name}</td>
                <td className="px-4 py-3 text-gold-100/60 whitespace-nowrap">⏱ {s.duration} min</td>
                <td className="px-4 py-3 text-gold-100/60 leading-relaxed">{s.description}</td>
                <td className="px-4 py-3 text-right">
                  {canEdit ? (
                    <Input
                      type="number"
                      defaultValue={s.price}
                      onBlur={(e) => {
                        const n = Number(e.target.value);
                        if (n > 0 && n !== s.price) handlePriceChange(s.id, n);
                      }}
                      className="font-mono w-28 text-right ml-auto"
                    />
                  ) : (
                    <span className="font-mono text-gold-300">₱{s.price.toLocaleString("en-PH")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

