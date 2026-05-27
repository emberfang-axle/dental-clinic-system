import { useCallback, useState } from "react";
import { Badge, Button, Card, ConfirmDialog, EmptyState } from "../../components/ui";
import { notificationsService } from "../../services/notifications";
import { useStore } from "../../store/store";
import { formatDateTime } from "../../shared/helpers";
import type { Role, NotificationEntry } from "../../shared/types";

const PAGE_SIZE = 10;

export function NotificationsCenter() {
  const { notifications, announcements, user } = useStore() as {
    notifications: NotificationEntry[];
    announcements: any[];
    user: { id: string; name: string; role: Role } | null;
  };
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!user) return null;

  const mine = notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => b.at.localeCompare(a.at));

  const unreadCount = mine.filter((n) => !n.read).length;
  const visible = mine.slice(0, visibleCount);

  const handleMarkRead = useCallback((id: string) => {
    notificationsService.markRead(id);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    notificationsService.markAllRead(user.id);
  }, [user.id]);

  const handleDelete = useCallback((id: string) => {
    notificationsService.delete(id);
  }, []);

  const handleClearAll = useCallback(() => {
    notificationsService.deleteAll(user.id);
  }, [user.id]);

  return (
    <div className="space-y-6" aria-label="Notifications">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Notifications</div>
            <h3 className="font-serif text-2xl text-gold-gradient mt-1">
              Reminders & Updates
              {unreadCount > 0 && (
                <span className="ml-3 text-sm font-sans font-normal text-gold-300/70">({unreadCount} unread)</span>
              )}
            </h3>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              Mark All as Read
            </Button>
          )}
          {mine.length > 0 && (
            <Button variant="danger" size="sm" onClick={() => setConfirmClearAll(true)}>
              Clear All
            </Button>
          )}
        </div>
      </Card>

      <div className="space-y-3" role="list">
        {mine.length === 0 && (
          <Card>
            <EmptyState icon="—" title="No notifications yet" subtitle="You'll see appointment updates and reminders here." />
          </Card>
        )}
        {visible.map((n) => (
          <div key={n.id} role="listitem">
            <Card className={n.read ? "opacity-70" : "border-gold-500/30"}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-gold-100">{n.title}</h4>
                  <Badge
                    tone={n.kind === "payment" ? "confirmed" : n.kind === "appointment" ? "pending" : "neutral"}
                  >
                    {n.kind}
                  </Badge>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-gold-400 inline-block" aria-label="Unread" />}
                </div>
                <p className="mt-2 text-sm text-gold-100/65 leading-relaxed">{n.message}</p>
                <time className="mt-2 block text-[11px] uppercase tracking-[0.2em] text-gold-300/45" dateTime={n.at}>
                  {formatDateTime(n.at)}
                </time>
              </div>
              {!n.read && (
                <Button size="sm" variant="ghost" onClick={() => handleMarkRead(n.id)} aria-label="Mark as read">
                  Mark Read
                </Button>
              )}
              <button
                type="button"
                onClick={() => setDeleteId(n.id)}
                aria-label="Delete notification"
                className="text-gold-100/30 hover:text-red-400 transition text-lg leading-none shrink-0"
              >
                ✕
              </button>
            </div>
          </Card>
          </div>
        ))}
        {mine.length > visibleCount && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Load More ({mine.length - visibleCount} remaining)
            </Button>
          </div>
        )}
      </div>

      {announcements.length > 0 && (
        <div>
          <h3 className="font-serif text-xl text-gold-gradient mb-3">Clinic Announcements</h3>
          <div className="space-y-3">
            {announcements.map((a: any) => (
              <div key={a.id} className={`glass rounded-xl p-5 border ${a.pinned ? "border-gold-400/40" : "border-gold-500/15"}`}>
                {a.pinned && <span className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold">Pinned · </span>}
                <span className="font-semibold text-gold-100">{a.title}</span>
                <p className="text-sm text-gold-100/65 mt-2 leading-relaxed">{a.body}</p>
                <p className="text-[10px] text-gold-100/40 mt-2">{a.author} · {new Date(a.at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmClearAll}
        title="Clear all notifications?"
        message={`Remove all ${mine.length} notifications from your inbox? This cannot be undone.`}
        confirmLabel="Clear All"
        danger
        onCancel={() => setConfirmClearAll(false)}
        onConfirm={() => {
          setConfirmClearAll(false);
          handleClearAll();
        }}
      />
      <ConfirmDialog
        open={!!deleteId}
        title="Delete notification?"
        message="Remove this notification from your inbox?"
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
