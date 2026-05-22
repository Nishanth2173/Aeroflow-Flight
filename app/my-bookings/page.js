'use client';

export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, RefreshCw, XCircle, ChevronDown, ChevronUp, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/useAuth';
import { format, parseISO, differenceInHours } from 'date-fns';
import toast from 'react-hot-toast';

// ─── Inline sign-in wall ───────────────────────────────────────────────────
function SignInWall() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const supabase = createClient();
      let error;
      if (mode === 'login') {
        ({ error } = await supabase.auth.signInWithPassword({ email, password }));
      } else {
        if (password.length < 8) throw new Error('Password must be at least 8 characters');
        ({ error } = await supabase.auth.signUp({ email, password }));
      }
      if (error) throw error;
      toast.success(mode === 'login' ? 'Signed in!' : 'Account created!');
      // useAuth hook will re-render the page automatically
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up-fade">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #1d6fa6, #38a3d4)', boxShadow: '0 0 30px rgba(56,163,212,0.3)' }}>
            <Plane size={22} className="text-white" style={{ transform: 'rotate(45deg)' }} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {mode === 'login' ? 'Sign in to view bookings' : 'Create an account'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Your bookings are securely tied to your account
          </p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-field" style={{ paddingLeft: '2.25rem' }}
                placeholder="your@email.com" required autoFocus />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-field" style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                placeholder="Password" required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Please wait...</span>
                : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'rgba(56,163,212,0.06)', border: '1px solid rgba(56,163,212,0.15)' }}>
            <span style={{ color: 'var(--accent-sky)', fontFamily: 'var(--font-mono)' }}>Test: </span>
            <span style={{ color: 'var(--text-secondary)' }}>test@aeroflow.dev / TestPass123!</span>
          </div>
        </div>

        <p className="text-center mt-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ color: 'var(--accent-sky)' }} className="font-medium hover:underline">
            {mode === 'login' ? 'Create one free' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,26,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="glass-card p-6 max-w-sm w-full animate-slide-up-fade" style={{ border: '1px solid rgba(232,83,58,0.3)' }}>
        <XCircle size={32} className="mb-3" style={{ color: 'var(--accent-coral)' }} />
        <h3 className="text-lg font-bold mb-2">Are you sure?</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm} className="flex-1 justify-center py-2 px-4 rounded-xl font-semibold"
            style={{ background: 'rgba(232,83,58,0.2)', color: 'var(--accent-coral)', border: '1px solid rgba(232,83,58,0.4)' }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking card ─────────────────────────────────────────────────────────────
function BookingCard({ booking, onCancel, onReschedule }) {
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const flight = booking.flights;
  const seat = booking.seats;
  const passenger = booking.passengers?.[0];
  const departs = flight?.departs_at ? new Date(flight.departs_at) : null;
  const arrives = flight?.arrives_at ? new Date(flight.arrives_at) : null;

  // Build display times from depart_time/arrive_time if departs_at is the placeholder date
  const departDisplay = flight?.depart_time
    ? flight.depart_time.slice(0, 5)
    : (departs ? format(departs, 'HH:mm') : '—');
  const arriveDisplay = flight?.arrive_time
    ? flight.arrive_time.slice(0, 5)
    : (arrives ? format(arrives, 'HH:mm') : '—');

  const bookedAt = booking.booked_at ? parseISO(booking.booked_at) : null;

  // For 2-hour rule: use a far-future placeholder since we use time-based flights
  const canCancel = booking.status !== 'cancelled';
  const canReschedule = booking.status !== 'cancelled';

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          message="This will cancel your booking and free the seat. This cannot be undone."
          onConfirm={() => { setShowConfirm(false); onCancel(booking.id); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div className="glass-card glass-card-hover animate-slide-up-fade">
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-lg" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>
                  {booking.pnr_code}
                </span>
                <span className={`badge badge-${booking.status}`}>{booking.status}</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Booked {bookedAt ? format(bookedAt, 'dd MMM yyyy HH:mm') : '—'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                ₹{booking.total_price?.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Seat {seat?.seat_number} · {seat?.class}
              </div>
            </div>
          </div>

          {/* Route */}
          {flight && (
            <div className="flex items-center gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{flight.origin}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{departDisplay}</div>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                <Plane size={14} style={{ color: 'var(--accent-sky)', transform: 'rotate(45deg)' }} />
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{flight.destination}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{arriveDisplay}</div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {canReschedule && (
              <button onClick={() => onReschedule(booking)} className="btn-ghost text-sm py-2 px-3" style={{ color: 'var(--accent-sky)' }}>
                <RefreshCw size={13} /> Reschedule
              </button>
            )}
            {canCancel && (
              <button onClick={() => setShowConfirm(true)} className="btn-ghost text-sm py-2 px-3" style={{ color: 'var(--accent-coral)', borderColor: 'rgba(232,83,58,0.3)' }}>
                <XCircle size={13} /> Cancel
              </button>
            )}
            <button onClick={() => setExpanded(!expanded)} className="btn-ghost text-sm py-2 px-3 ml-auto">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Details
            </button>
          </div>

          {expanded && passenger && (
            <div className="mt-4 pt-4 text-sm space-y-2 animate-slide-up-fade" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Passenger:</span> <span>{passenger.full_name}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Nationality:</span> <span>{passenger.nationality}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Flight:</span> <span className="font-mono">{flight?.flight_no}</span></div>
              <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Aircraft:</span> <span>{flight?.aircraft_type}</span></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MyBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  async function fetchBookings() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('bookings')
      .select('*, flights(*), seats(*), passengers(*)')
      .eq('user_id', user.id)
      .order('booked_at', { ascending: false });
    if (data) setBookings(data);
    setLoading(false);
  }

  const handleCancel = async (bookingId) => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_user_id: user.id,
    });
    if (error || !data?.success) {
      toast.error(data?.error || error?.message || 'Failed to cancel booking');
    } else {
      toast.success('Booking cancelled successfully');
      fetchBookings();
    }
  };

  const handleReschedule = (booking) => {
    router.push(`/reschedule?bookingId=${booking.id}&origin=${booking.flights?.origin}&destination=${booking.flights?.destination}`);
  };

  // Still checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in — show inline sign-in, no redirect
  if (!user) return <SignInWall />;

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-slide-up-fade">
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>My Bookings</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <button onClick={fetchBookings} className="btn-ghost text-sm py-2 px-3">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="glass-card h-40 shimmer" />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <Plane size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)', transform: 'rotate(45deg)' }} />
            <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Your future flights will appear here.</p>
            <button onClick={() => router.push('/search')} className="btn-primary mt-6">Search Flights</button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <BookingCard key={b.id} booking={b} onCancel={handleCancel} onReschedule={handleReschedule} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}