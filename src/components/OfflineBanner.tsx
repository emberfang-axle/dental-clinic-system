import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (!offline) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[9999] bg-red-600/95 backdrop-blur text-white text-xs font-semibold text-center py-2 px-4 flex items-center justify-center gap-2">
      <span>⚠</span> You're offline — some features may not work until your connection is restored.
    </div>
  );
}
