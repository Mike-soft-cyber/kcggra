/**
 * PageLoader.jsx
 *
 * Bouncing dots loader in KCGGRA navy + gold palette.
 * Use inside pages as a content loader (not full screen).
 * DashboardLayout stays mounted — only the page content shows this.
 *
 * Usage:
 *   import PageLoader from '@/components/PageLoader';
 *   if (loading) return <PageLoader />;
 */

export default function PageLoader({ message = '' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-5">
      {/* Three bouncing dots */}
      <div className="flex items-center gap-2.5">
        <span className="w-3 h-3 rounded-full bg-[#0F172A] animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '700ms' }} />
        <span className="w-3 h-3 rounded-full bg-[#FDE9AB] animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '700ms' }} />
        <span className="w-3 h-3 rounded-full bg-[#0F172A] animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '700ms' }} />
      </div>
      {message && (
        <p className="text-[#94A3B8] text-sm font-medium tracking-wide">{message}</p>
      )}
    </div>
  );
}

/**
 * Inline variant — small loader for cards/sections
 * Usage: <InlineLoader />
 */
export function InlineLoader() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-8">
      <span className="w-2 h-2 rounded-full bg-[#0F172A] animate-bounce"
        style={{ animationDelay: '0ms', animationDuration: '700ms' }} />
      <span className="w-2 h-2 rounded-full bg-[#FDE9AB] animate-bounce"
        style={{ animationDelay: '150ms', animationDuration: '700ms' }} />
      <span className="w-2 h-2 rounded-full bg-[#0F172A] animate-bounce"
        style={{ animationDelay: '300ms', animationDuration: '700ms' }} />
    </div>
  );
}