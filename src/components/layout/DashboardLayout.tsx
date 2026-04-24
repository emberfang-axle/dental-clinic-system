/**
 * Shared dashboard chrome (sidebar + header + responsive burger menu).
 * Wraps role-specific dashboards. Each dashboard provides its own
 * tab list and content via props — DashboardLayout never knows about
 * role-specific business logic.
 *
 * Layout Options:
 *   • Option A (Desktop ≥ lg) — profile pill in header upper-right.
 *   • Option B (Mobile/Tablet < lg) — profile lives only in the sidebar
 *     near "Logout"; header is kept compact and uncluttered.
 */

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "../ui";
import { Logo } from "../Logo";
import { authService } from "../../services/auth";
import { initials, roleLabel, shortRole } from "../../shared/helpers";
import { ROUTES } from "../../shared/constants";
import type { DashboardTab, User } from "../../shared/types";

interface DashboardLayoutProps {
  user: User;
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  navigate: (path: string) => void;
  /** Optional extra header action (e.g. Patient "+ Book Appointment"). */
  headerAction?: ReactNode;
  children: ReactNode;
}

export function DashboardLayout({
  user,
  tabs,
  activeTab,
  onTabChange,
  navigate,
  headerAction,
  children,
}: DashboardLayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const currentLabel = tabs.find((t) => t.id === activeTab)?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-ink-950 flex relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[520px] h-[520px] bg-gold-600/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-gold-500/6 rounded-full blur-[120px] pointer-events-none" />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 border-r border-gold-soft bg-ink-900/70 backdrop-blur-xl flex-col relative z-10">
        <SidebarNav
          user={user}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          navigate={navigate}
        />
      </aside>

      {/* Mobile/tablet drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <aside className="absolute left-0 top-0 h-full w-[86vw] max-w-xs border-r border-gold-soft bg-ink-900/95 backdrop-blur-2xl shadow-2xl flex flex-col">
            <SidebarNav
              user={user}
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(next) => {
                onTabChange(next);
                setMenuOpen(false);
              }}
              navigate={navigate}
              onNavigateAway={() => setMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="min-h-20 border-b border-gold-soft px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 bg-ink-950/60 backdrop-blur-xl">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden h-11 px-3 rounded-xl border border-gold-500/30 bg-ink-900/80 text-gold-100 flex items-center justify-center gap-2 hover:bg-gold-500/10 shadow-luxe transition"
              aria-label="Open dashboard menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              <span className="text-[11px] uppercase tracking-[0.22em]">Menu</span>
            </button>

            <div className="min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl text-gold-shine truncate">
                {currentLabel}
              </h1>
              <p className="text-xs text-gold-100/50 mt-0.5 truncate hidden sm:block">
                Welcome back, <span className="text-gold-300">{user.name.split(" ")[0]}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {headerAction}

            {/* OPTION A — Desktop only profile pill (hidden on mobile/tablet). */}
            <button
              onClick={() => onTabChange("profile")}
              className="no-min hidden lg:flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border border-gold-500/25 bg-ink-900/70 hover:bg-gold-500/10 hover:border-gold-400/50 transition shadow-luxe"
              aria-label="Open profile"
            >
              <span className="w-9 h-9 rounded-full bg-gold-gradient flex items-center justify-center text-ink-950 font-bold text-sm shadow-gold">
                {initials(user.name)}
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-sm font-semibold text-gold-100 truncate max-w-[140px]">
                  {user.name.split(" ")[0]}
                </span>
                <span className="text-[9px] uppercase tracking-[0.22em] text-gold-300/70 font-semibold">
                  {shortRole(user.role)}
                </span>
              </span>
            </button>
          </div>
        </header>

        {/* No mobile horizontal tab strip — sidebar is the single source of nav. */}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarNav({
  user,
  tabs,
  activeTab,
  onTabChange,
  navigate,
  onNavigateAway,
}: {
  user: User;
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  navigate: (path: string) => void;
  onNavigateAway?: () => void;
}) {
  return (
    <>
      <div className="p-5 border-b border-gold-soft">
        <button
          onClick={() => {
            navigate(ROUTES.home);
            onNavigateAway?.();
          }}
          className="hover:opacity-80 transition"
        >
          <Logo size={36} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[9px] uppercase tracking-[0.3em] text-gold-300/50 font-semibold px-3 mb-2 mt-2">
          Navigation
        </div>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all flex items-center gap-3 min-h-[44px] ${
              activeTab === t.id
                ? "bg-gradient-to-r from-gold-500/20 to-gold-500/5 text-gold-100 border border-gold-500/40 shadow-[inset_0_1px_0_rgba(255,240,180,0.05)]"
                : "text-gold-100/60 hover:bg-gold-500/5 hover:text-gold-200 border border-transparent"
            }`}
          >
            <span className="text-base">{t.icon}</span>
            <span className="font-medium truncate">{t.label}</span>
            {activeTab === t.id && <span className="ml-auto w-1 h-4 rounded-full bg-gold-400" />}
          </button>
        ))}
      </nav>

      {/* OPTION B — profile lives in the sidebar near Logout for mobile/tablet. */}
      <div className="p-3 border-t border-gold-soft space-y-2">
        <button
          onClick={() => onTabChange("profile")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition min-h-[44px] ${
            activeTab === "profile"
              ? "border-gold-500/40 bg-gold-500/10"
              : "border-gold-500/20 bg-ink-900/50 hover:border-gold-400/40 hover:bg-gold-500/5"
          }`}
          aria-label="Open profile"
        >
          <span className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center text-ink-950 font-bold text-sm shadow-gold shrink-0">
            {initials(user.name)}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block text-sm font-semibold text-gold-100 truncate">{user.name}</span>
            <span className="block text-[9px] uppercase tracking-[0.26em] text-gold-300/70 truncate font-semibold">
              {roleLabel(user.role)} · View profile
            </span>
          </span>
        </button>

        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            navigate(ROUTES.home);
            onNavigateAway?.();
          }}
        >
          View website
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            void authService.logout();
            navigate(ROUTES.home);
            onNavigateAway?.();
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Logout
        </Button>
      </div>
    </>
  );
}
