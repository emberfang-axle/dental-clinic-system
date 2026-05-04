import { ROUTES } from "../../shared/constants";

export function NotFoundPage({ navigate }: { navigate: (p: string) => void }) {
  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="font-serif text-[8rem] leading-none text-gold-500/20 select-none">404</div>
        <h1 className="font-serif text-3xl text-gold-shine mt-2 mb-3">Page not found</h1>
        <p className="text-gold-100/50 text-sm mb-8">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate(ROUTES.home)}
          className="px-6 py-2.5 rounded-md bg-gold-gradient text-ink-950 text-sm font-semibold hover:brightness-110 transition"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
