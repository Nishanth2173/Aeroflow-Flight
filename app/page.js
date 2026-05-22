'use client';

export const dynamic = 'force-dynamic';


import Link from 'next/link';
import { Plane, Shield, Clock, Zap, ArrowRight, MapPin } from 'lucide-react';

export default function HomePage() {
  const features = [
    { icon: Zap, title: 'Instant Booking', desc: 'Reserve your seat in seconds with our lightning-fast booking system.' },
    { icon: Shield, title: 'Secure & Safe', desc: 'Bank-grade encryption and RLS-enforced data security on every booking.' },
    { icon: Clock, title: 'Live Seat Maps', desc: 'Real-time seat availability updated instantly as others book.' },
  ];

  const routes = [
    { from: 'BOM', to: 'DEL', fromFull: 'Mumbai', toFull: 'Delhi', price: '₹4,500', time: '2h 10m' },
    { from: 'DEL', to: 'BLR', fromFull: 'Delhi', toFull: 'Bangalore', price: '₹5,800', time: '2h 45m' },
    { from: 'BLR', to: 'HYD', fromFull: 'Bangalore', toFull: 'Hyderabad', price: '₹2,800', time: '1h 20m' },
    { from: 'HYD', to: 'BOM', fromFull: 'Hyderabad', toFull: 'Mumbai', price: '₹3,600', time: '1h 40m' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-slide-up-fade"
            style={{
              background: 'rgba(56,163,212,0.1)',
              border: '1px solid rgba(56,163,212,0.25)',
              color: 'var(--accent-sky)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-jade-500 animate-pulse-slow" />
            8 flights across 4 premium routes
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up-fade animate-delay-100"
            style={{ fontFamily: 'var(--font-display)', lineHeight: 1.1 }}
          >
            Fly Smarter,<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #38a3d4, #2ec48a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Book Better
            </span>
          </h1>

          <p
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto animate-slide-up-fade animate-delay-200"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
          >
            Search, book, and manage your flights with real-time seat selection,
            instant confirmation, and seamless rescheduling — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up-fade animate-delay-300">
            <Link href="/search" className="btn-gold text-base px-8 py-4">
              <Plane size={18} />
              Search Flights
              <ArrowRight size={16} />
            </Link>
            <Link href="/auth/register" className="btn-ghost text-base px-8 py-4">
              Create Free Account
            </Link>
          </div>
        </div>

        {/* Floating plane decoration */}
        <div
          className="absolute top-1/4 right-8 opacity-10 animate-float hidden lg:block"
          style={{ fontSize: '120px', transform: 'rotate(45deg)' }}
        >
          ✈
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="glass-card glass-card-hover p-6 animate-slide-up-fade"
                style={{ animationDelay: `${0.1 * i}s`, opacity: 0 }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(29,111,166,0.3), rgba(56,163,212,0.2))',
                    border: '1px solid rgba(56,163,212,0.3)',
                  }}
                >
                  <Icon size={18} style={{ color: 'var(--accent-sky)' }} />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold mb-8 text-center"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Popular Routes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {routes.map(({ from, to, fromFull, toFull, price, time }) => (
              <Link
                key={`${from}-${to}`}
                href={`/search?origin=${from}&destination=${to}`}
                className="glass-card glass-card-hover p-5 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div
                      className="text-2xl font-bold"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
                    >
                      {from}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{fromFull}</div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <Plane
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                      style={{ color: 'var(--accent-sky)', transform: 'rotate(45deg)' }}
                    />
                  </div>
                  <div className="text-right">
                    <div
                      className="text-2xl font-bold"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}
                    >
                      {to}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{toFull}</div>
                  </div>
                </div>
                <div
                  className="h-px mb-3"
                  style={{ background: 'var(--border-color)' }}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold" style={{ color: 'var(--accent-gold)' }}>
                    From {price}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {time}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div
            className="glass-card p-10 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(29,111,166,0.15), rgba(15,32,64,0.8))',
              border: '1px solid rgba(56,163,212,0.25)',
            }}
          >
            <h2
              className="text-3xl font-bold mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ready to take off?
            </h2>
            <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
              Join thousands of travelers who book smarter with AeroFlow.
            </p>
            <Link href="/auth/register" className="btn-gold text-base px-8 py-4">
              Get Started Free
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}