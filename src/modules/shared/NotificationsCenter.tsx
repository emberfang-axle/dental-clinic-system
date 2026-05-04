import { useCallback } from "react";
import { Badge, Button, Card } from "../../components/ui";
import { notificationsService } from "../../services/notifications";
import { useStore } from "../../store/store";
import { formatDateTime } from "../../shared/helpers";
import type { Role, NotificationEntry } from "../../shared/types";

export function NotificationsCenter() {
  const { notifications, announcements, user } = useStore() as {
    notifications: NotificationEntry[];
    announcements: any[];
    user: { id: string; name: string; role: Role } | null;
  };

  if (!user) return null;

  const mine = notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.at.localeCompare(a.at));

  const handleMarkRead = useCallback((notificationId: string) => {
    notificationsService.markRead(notificationId);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    notificationsService.markAllRead(user.id);
  }, [user.id]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Notifications</div>
            <h3 className="font-serif text-2xl text-gold-gradient mt-1">Reminders, Payment Updates & Schedule Alerts</h3>
          </div>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {mine.map((n) => (
          <Card key={n.id} className={n.read ? "opacity-80" : "border-gold-500/30"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-gold-100">{n.title}</h4>
                  <Badge 
                    tone={
                      n.kind === "payment" 
                        ? "confirmed" 
                        : n.kind === "appointment" 
                        ? "pending" 
                        : "neutral"
                    }
                  >
                    {n.kind}
                  </Badge>
                  {!n.read && <Badge tone="paid">Unread</Badge>}
                </div>
                <p className="mt-2 text-sm text-gold-100/65 leading-relaxed">{n.message}</p>
                <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-gold-300/45">
                  {formatDateTime(n.at)}
                </div>
              </div>
              {!n.read && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleMarkRead(n.id)}
                >
                  Mark Read
                </Button>
              )}
            </div>
          </Card>
        ))}
        {mine.length === 0 && (
          <Card>
            <p className="text-sm text-gold-100/60">You have no notifications yet.</p>
          </Card>
        )}
      </div>

      {announcements.length > 0 && (
        <div>
          <h3 className="font-serif text-xl text-gold-gradient mb-3">Clinic Announcements</h3>
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div key={a.id} className={`glass rounded-xl p-5 border ${a.pinned ? "border-gold-400/40" : "border-gold-500/15"}`}>
                {a.pinned && <span className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold">📌 Pinned · </span>}
                <span className="font-semibold text-gold-100">{a.title}</span>
                <p className="text-sm text-gold-100/65 mt-2 leading-relaxed">{a.body}</p>
                <p className="text-[10px] text-gold-100/40 mt-2">{a.author} · {new Date(a.at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

