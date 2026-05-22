export const dynamic = 'force-dynamic';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-slide-up-fade">
        <div
          className="inline-flex w-20 h-20 rounded-full items-center justify-center mb-6"
          style={{
            background: 'rgba(232,83,58,0.1)',
            border: '2px solid rgba(232,83,58,0.3)',
          }}
        >
          <span style={{ fontSize: '36px' }}>✈</span>
        </div>
        <h1
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          You&apos;re Offline
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry —
          your cached bookings are still accessible from{' '}
          <strong style={{ color: 'var(--accent-sky)' }}>My Bookings</strong>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/my-bookings" className="btn-primary justify-center">
            View My Bookings
          </a>
          <button
            onClick={() => window.location.reload()}
            className="btn-ghost justify-center"
          >
            Try Again
          </button>
        </div>
        <p className="mt-8 text-xs" style={{ color: 'var(--text-muted)' }}>
          AeroFlow · Offline Mode
        </p>
      </div>
    </div>
  );
}