import { useRef, useState } from "react";
import { Button, Input, Label, Textarea } from "../../components/ui";
import { announcementsService } from "../../services/announcements";
import { useStore } from "../../store/store";

export function AnnouncementsPage() {
  const { announcements, user } = useStore();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function post() {
    if (!title.trim() || !body.trim() || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      await announcementsService.post(title.trim(), body.trim(), user!.name, user!.role, pinned);
      setTitle(""); setBody(""); setPinned(false);
    } catch (err: any) {
      setError(err.message || "Failed to post. Make sure Firestore rules are deployed.");
    } finally {
      setSaving(false);
      submitting.current = false;
    }
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="glass-strong rounded-2xl p-6 space-y-4">
        <h3 className="font-serif text-xl text-gold-gradient">Post Announcement</h3>
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Clinic closed on May 12" />
        </div>
        <div>
          <Label>Message</Label>
          <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your announcement here..." />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gold-100/70 cursor-pointer">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="accent-gold-500" />
            Pin to top
          </label>
          <Button onClick={post} disabled={saving || !title.trim() || !body.trim()}>
            {saving ? "Posting..." : "Post Announcement"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* List */}
      <div className="space-y-3">
        {announcements.length === 0 && (
          <div className="glass rounded-xl p-6 text-center text-gold-100/50 text-sm">No announcements yet.</div>
        )}
        {announcements.map((a) => (
          <div key={a.id} className={`glass rounded-xl p-5 border ${a.pinned ? "border-gold-400/40" : "border-gold-500/15"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.pinned && <span className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold">Pinned</span>}
                  <h4 className="font-semibold text-gold-100">{a.title}</h4>
                </div>
                <p className="text-sm text-gold-100/65 mt-2 leading-relaxed">{a.body}</p>
                <p className="text-[10px] text-gold-100/40 mt-2">{a.author} · {new Date(a.at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => announcementsService.togglePin(a.id)} className="text-xs text-gold-400/60 hover:text-gold-300 transition px-2 py-1 rounded border border-gold-500/20">
                  {a.pinned ? "Unpin" : "Pin"}
                </button>
                <button onClick={() => announcementsService.remove(a.id)} className="text-xs text-red-400/60 hover:text-red-400 transition px-2 py-1 rounded border border-red-500/20">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
