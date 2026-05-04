import React, { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
/**
 * Reusable UI primitives — design system only, no business logic.
 * Used across landing, auth, and dashboards.
 */

import { cn } from "../../utils/cn";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger" | "subtle" | "dark";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "px-3.5 py-2 text-xs tracking-wide",
    md: "px-5 py-2.5 text-sm tracking-wide",
    lg: "px-8 py-3.5 text-sm tracking-[0.15em] uppercase",
  } as const;
  const variants = {
    primary: "bg-gold-gradient text-ink-950 font-semibold hover:brightness-110 shadow-gold btn-luxe",
    outline: "border border-gold-500/50 text-gold-200 hover:border-gold-400 hover:bg-gold-500/5 hover:text-gold-100 backdrop-blur",
    ghost: "text-gold-200 hover:bg-gold-500/10",
    danger: "bg-red-600/90 hover:bg-red-600 text-white",
    subtle: "bg-ink-700/80 text-gold-100 hover:bg-ink-600 border border-gold-500/20 backdrop-blur",
    dark: "bg-ink-900 text-gold-200 border border-gold-500/30 hover:bg-ink-800",
  } as const;
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-md bg-ink-900/60 border border-gold-500/15 px-4 py-3 text-gold-50 placeholder:text-gold-100/25 text-sm",
        "focus:outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20 focus:bg-ink-900 transition",
        props.className,
      )}
    />
  );
}

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = React.useState(false);
  const fieldId = props.id || props.name || props.placeholder?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || undefined;
  return (
    <div className="relative">
      <input
        id={fieldId}
        name={fieldId}
        {...props}
        type={show ? "text" : "password"}
        className={cn(
          "w-full rounded-md bg-ink-900/60 border border-gold-500/15 px-4 py-3 pr-11 text-gold-50 placeholder:text-gold-100/25 text-sm",
          "focus:outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20 focus:bg-ink-900 transition",
          props.className,
        )}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-400/60 hover:text-gold-300 transition"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-md bg-ink-900/60 border border-gold-500/15 px-4 py-3 text-gold-50 placeholder:text-gold-100/25 text-sm",
        "focus:outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20 focus:bg-ink-900 transition",
        props.className,
      )}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldId = props.id || props.name || undefined;
  return (
    <select
      id={fieldId}
      name={fieldId}
      {...props}
      className={cn(
        "w-full rounded-md bg-ink-900/60 border border-gold-500/15 px-4 py-3 text-gold-50 text-sm appearance-none cursor-pointer",
        "focus:outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/20 transition",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23dab23c%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_1rem_center]",
        props.className,
      )}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-300/80 mb-2">
      {children}
    </label>
  );
}

export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl glass p-6 transition-all duration-500",
        hover && "hover:border-gold-400/40 hover:shadow-luxe hover:-translate-y-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "pending" | "confirmed" | "completed" | "paid" | "cancelled" | "neutral" | "emergency";
}) {
  const tones = {
    pending: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
    confirmed: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    completed: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    cancelled: "bg-red-500/10 text-red-300 border-red-500/30",
    emergency: "bg-red-600/15 text-red-200 border-red-500/40 animate-pulse",
    neutral: "bg-gold-500/10 text-gold-200 border-gold-500/25",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
  centered = true,
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  centered?: boolean;
}) {
  return (
    <section id={id} className={cn("py-24 md:py-32 px-6 relative", className)}>
      <div className="max-w-6xl mx-auto relative">
        {(eyebrow || title || subtitle) && (
          <div className={cn("mb-16", centered && "text-center")}>
            {eyebrow && (
              <div className={cn("inline-flex items-center gap-3 mb-5", centered && "justify-center")}>
                <span className="h-px w-8 bg-gold-500/50" />
                <p className="text-[10px] uppercase tracking-[0.4em] text-gold-400 font-semibold">{eyebrow}</p>
                <span className="h-px w-8 bg-gold-500/50" />
              </div>
            )}
            {title && (
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-gold-shine leading-[1.1] tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={cn("mt-6 text-base md:text-lg text-gold-100/55 max-w-2xl leading-relaxed font-light", centered && "mx-auto")}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function Ornament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 12" className={cn("text-gold-400", className)} fill="none" stroke="currentColor" strokeWidth="0.7">
      <line x1="0" y1="6" x2="38" y2="6" />
      <path d="M38 6 L46 2 L50 6 L46 10 Z" fill="currentColor" />
      <circle cx="50" cy="6" r="1.5" fill="currentColor" />
      <path d="M62 6 L54 2 L50 6 L54 10 Z" fill="currentColor" />
      <line x1="62" y1="6" x2="100" y2="6" />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: ReactNode;
  icon: string;
  sub?: string;
}) {
  return (
    <Card className="!p-5">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-gold-100/50">{label}</div>
      <div className="text-2xl font-serif text-gold-gradient mt-1">{value}</div>
      {sub && <div className="text-[10px] text-gold-100/40 mt-1">{sub}</div>}
    </Card>
  );
}
