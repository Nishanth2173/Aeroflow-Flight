'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Plane, Menu, X, User, LogOut, BookOpen, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import useUserStore from '@/store/userStore';
import useFlightStore from '@/store/flightStore';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession } = useUserStore();
  const { resetAll } = useFlightStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearSession();
    resetAll();
    router.push('/');
    setMenuOpen(false);
  };

  const navLinks = [
    { href: '/search', label: 'Search Flights', icon: Search },
    { href: '/my-bookings', label: 'My Bookings', icon: BookOpen },
  ];

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? 'rgba(6, 13, 26, 0.95)'
          : 'rgba(6, 13, 26, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: scrolled
          ? '1px solid rgba(56,163,212,0.2)'
          : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            onClick={() => setMenuOpen(false)}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, #1d6fa6, #38a3d4)',
                boxShadow: '0 0 16px rgba(56,163,212,0.3)',
              }}
            >
              <Plane size={16} className="text-white" style={{ transform: 'rotate(45deg)' }} />
            </div>
            <span
              className="text-xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Aero<span style={{ color: 'var(--accent-sky)' }}>Flow</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: pathname === href ? 'var(--accent-sky)' : 'var(--text-secondary)',
                  background: pathname === href ? 'rgba(56,163,212,0.1)' : 'transparent',
                }}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(56,163,212,0.1)', border: '1px solid rgba(56,163,212,0.2)' }}
                >
                  <User size={14} style={{ color: 'var(--accent-sky)' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
                  style={{
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="btn-ghost text-sm py-2 px-4">
                  Sign in
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="md:hidden pb-4 animate-slide-up-fade"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            <div className="pt-3 space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium"
                  style={{ color: pathname === href ? 'var(--accent-sky)' : 'var(--text-secondary)' }}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm"
                    style={{ color: 'var(--accent-coral)' }}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                ) : (
                  <div className="space-y-2 px-2">
                    <Link href="/auth/login" className="btn-ghost w-full justify-center" onClick={() => setMenuOpen(false)}>
                      Sign in
                    </Link>
                    <Link href="/auth/register" className="btn-primary w-full justify-center" onClick={() => setMenuOpen(false)}>
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
