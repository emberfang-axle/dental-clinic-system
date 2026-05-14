import { useEffect, useState, type ReactNode } from "react";
import { Button } from "../ui";
import { Logo } from "../Logo";
import { authService } from "../../services/auth";
import { initials, roleLabel, shortRole } from "../../shared/helpers";
import { ROUTES } from "../../shared/constants";
import type { DashboardTab, User } from "../../shared/types";
import { useStore } from "../../store/store";

interface DashboardLayoutProps {
  user: User;
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  navigate: (path: string) => void;
  headerAction?: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({ user, tabs, activeTab, onTabChange, navigate, headerAction, children }: DashboardLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { notifications } = useStore();
  const unread = notifications.filter((n) => n.userId === user.id && !n.read).length;

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const currentLabel = tabs.find((t) => t.id === activeTab)?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-ink-950 flex relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-gold-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-gold-500/6 rounded-full blur-[120px] pointer-events-none" />

      <aside className="hidden lg:flex w-60 border-r border-gold-soft bg-ink-900/70 backdrop-blur-xl flex-col relative z-10">
        <DesktopSidebar user={user} tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} navigate={navigate} unread={unread} />
      </aside>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-gold-soft bg-ink-900/98 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden">
            <DesktopSidebar user={user} tabs={tabs} activeTab={activeTab} unread={unread}
              onTabChange={(id) => { onTabChange(id); setMenuOpen(false); }}
              navigate={(p) => { navigate(p); setMenuOpen(false); }}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="min-h-16 border-b border-gold-soft px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 bg-ink-950/60 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMenuOpen(true)}
              className="lg:hidden h-10 w-10 rounded-xl border border-gold-500/30 bg-ink-900/80 text-gold-100 flex items-center justify-center hover:bg-gold-500/10 transition"
              aria-label="Open menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <h1 className="font-serif text-xl sm:text-2xl text-gold-shine truncate">{currentLabel}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
            <button onClick={() => onTabChange("notifications")}
              className="relative h-10 w-10 rounded-xl border border-gold-500/30 bg-ink-900/80 text-gold-100 flex items-center justify-center hover:bg-gold-500/10 transition"
              aria-label="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
            <button onClick={() => onTabChange("profile")}
              className="no-min hidden lg:flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full border border-gold-500/25 bg-ink-900/70 hover:bg-gold-500/10 hover:border-gold-400/50 transition">
              <span className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-ink-950 font-bold text-xs">
                {initials(user.name)}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-gold-100 truncate max-w-[120px]">{user.name.split(" ")[0]}</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-gold-300/70">{shortRole(user.role)}</span>
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function DesktopSidebar({ user, tabs, activeTab, onTabChange, navigate, unread }: {
  user: User; tabs: DashboardTab[]; activeTab: string; unread: number;
  onTabChange: (id: string) => void; navigate: (p: string) => void;
}) {
  return (
    <>
      <div className="p-4 border-b border-gold-soft">
        <button onClick={() => navigate(ROUTES.home)} className="hover:opacity-80 transition" aria-label="Go to home">
          <Logo size={32} />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overscroll-contain" aria-label="Dashboard navigation">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          const badge = t.id === "notifications" && unread > 0 ? unread : 0;
          return (
            <button key={t.id} onClick={() => onTabChange(t.id)}
              aria-current={isActive ? "page" : undefined}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                isActive
                  ? "bg-gold-500/15 text-gold-100 border border-gold-500/35"
                  : "text-gold-100/60 hover:bg-gold-500/5 hover:text-gold-200 border border-transparent"
              }`}>
              <span className="truncate">{t.label}</span>
              {badge > 0 ? (
                <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shrink-0">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : isActive ? (
                <span className="ml-auto w-1 h-4 rounded-full bg-gold-400 shrink-0" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-gold-soft space-y-1">
        <button onClick={() => onTabChange("profile")}
          aria-current={activeTab === "profile" ? "page" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition ${
            activeTab === "profile" ? "border-gold-500/35 bg-gold-500/10" : "border-gold-500/15 hover:bg-gold-500/5"
          }`}>
          <span className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-ink-950 font-bold text-xs shrink-0">
            {initials(user.name)}
          </span>
          <span className="min-w-0 text-left">
            <span className="block text-sm font-semibold text-gold-100 truncate">{user.name}</span>
            <span className="block text-[9px] uppercase tracking-[0.2em] text-gold-300/60">{roleLabel(user.role)}</span>
          </span>
        </button>
        <Button variant="ghost" className="w-full justify-start text-xs" onClick={() => navigate(ROUTES.home)}>
          View website
        </Button>
        <Button variant="ghost" className="w-full justify-start text-xs text-red-400/70 hover:text-red-300"
          onClick={() => { void authService.logout(); navigate(ROUTES.home); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Logout
        </Button>
      </div>
    </>
  );
}

