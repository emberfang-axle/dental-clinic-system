import { useCallback } from "react";
import { Card, Input } from "../../components/ui";
import { catalogService } from "../../services/catalog";
import { useStore } from "../../store/store";
import type { Role, Service } from "../../shared/types";

export function ServicesPage({ role }: { role: Role }) {
  const { services, user } = useStore() as {
    services: Service[];
    user: { id: string; name: string; role: Role } | null;
  };
  
  const canEdit = role === "doctor";

  const handlePriceChange = useCallback((serviceId: string, newPrice: number) => {
    if (canEdit && user) {
      catalogService.setPrice(serviceId, newPrice);
    }
  }, [canEdit, user]);

  return (
    <div className="space-y-4">
      {!canEdit && (
        <p className="text-sm text-gold-100/60">
          Only the clinic doctor can edit pricing. Staff have read-only access.
        </p>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((s) => (
          <Card key={s.id}>
            <h4 className="font-serif text-gold-gradient text-xl">{s.name}</h4>
            <p className="text-sm text-gold-100/60 mt-2 leading-relaxed">{s.description}</p>
            <div className="text-xs text-gold-100/50 mt-2">⏱ {s.duration} min</div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gold-100/50">₱</span>
              <Input
                type="number"
                defaultValue={s.price}
                disabled={!canEdit}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (n > 0 && n !== s.price) {
                    handlePriceChange(s.id, n);
                  }
                }}
                className="font-mono"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

