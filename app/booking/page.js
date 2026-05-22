'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, CreditCard, Mail, Lock, Eye, EyeOff, X, Plane, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import SeatMap from '@/components/seat-map/SeatMap';
import useFlightStore from '@/store/flightStore';
import { useAuth } from '@/lib/useAuth';
import { format, differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';
import { nanoid } from 'nanoid';

// ─── Inline Login Modal ───────────────────────────────────────────────────────
function LoginModal({ onSuccess, onClose }) {
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
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,26,0.9)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card w-full max-w-md p-8 animate-slide-up-fade" style={{ border: '1px solid rgba(56,163,212,0.3)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1d6fa6, #38a3d4)' }}>
              <Plane size={18} className="text-white" style={{ transform: 'rotate(45deg)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                {mode === 'login' ? 'Sign in to continue' : 'Create account'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Required to complete booking</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field" style={{ paddingLeft: '2.25rem' }} placeholder="your@email.com" required autoFocus />
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-field" style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }} placeholder="Password" required />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Please wait...</span>
              : mode === 'login' ? 'Sign In & Continue' : 'Create Account & Continue'}
          </button>
        </form>

        <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'rgba(56,163,212,0.06)', border: '1px solid rgba(56,163,212,0.15)' }}>
          <span style={{ color: 'var(--accent-sky)', fontFamily: 'var(--font-mono)' }}>Test: </span>
          <span style={{ color: 'var(--text-secondary)' }}>test@aeroflow.dev / TestPass123!</span>
        </div>

        <p className="text-center mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ color: 'var(--accent-sky)' }} className="font-medium hover:underline">
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ['Select Seats', 'Passenger Info', 'Pay & Confirm'];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const s = i + 1;
        const active = step === s;
        const done = step > s;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className="step-dot" style={{
                borderColor: done || active ? 'var(--accent-sky)' : 'var(--border-color)',
                background: done ? 'var(--accent-sky)' : active ? 'rgba(56,163,212,0.15)' : 'transparent',
                color: done ? 'white' : active ? 'var(--accent-sky)' : 'var(--text-muted)',
              }}>
                {done ? <CheckCircle size={14} /> : s}
              </div>
              <span className="text-xs hidden sm:block" style={{
                color: active ? 'var(--accent-sky)' : done ? 'var(--text-secondary)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="step-line mx-2" style={{ background: step > s ? 'var(--accent-sky)' : 'var(--border-color)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Main booking page inner ──────────────────────────────────────────────────
function BookingPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const flightId = params.get('flightId');
  const searchedDate = params.get('date');

  const {
    selectedFlight, selectedSeats, toggleSeat, clearSeats,
    passengerForm, setPassengerForm, resetBookingFlow, searchQuery,
  } = useFlightStore();

  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [flight, setFlight] = useState(selectedFlight);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [loading, setLoading] = useState(false);

  const maxSeats = searchQuery.passengerCount || 1;

  useEffect(() => {
    if (!flight && flightId) fetchFlight();
  }, [flightId]);

  useEffect(() => {
    if (user && pendingAction === 'pay') {
      setPendingAction(null);
      setShowLoginModal(false);
      triggerPayment();
    }
  }, [user, pendingAction]);

  async function fetchFlight() {
    const supabase = createClient();
    const { data } = await supabase.from('flights').select('*').eq('id', flightId).single();
    if (data) {
      if (searchedDate && data.depart_time && data.arrive_time) {
        const [dH, dM] = data.depart_time.split(':');
        const [aH, aM] = data.arrive_time.split(':');
        const dep = new Date(searchedDate); dep.setHours(+dH, +dM, 0, 0);
        const arr = new Date(searchedDate); arr.setHours(+aH, +aM, 0, 0);
        if (arr <= dep) arr.setDate(arr.getDate() + 1);
        data.departs_at = dep.toISOString();
        data.arrives_at = arr.toISOString();
      }
      setFlight(data);
    }
  }

  // Total price = base price × seats + sum of seat extra fees
  const seatsExtraFee = selectedSeats.reduce((sum, s) => sum + (s.extra_fee || 0), 0);
  const totalPrice = flight
    ? (flight.base_price * Math.max(selectedSeats.length, 1)) + seatsExtraFee
    : 0;

  const handleSeatToggle = (seat) => {
    const isSelected = selectedSeats.find(s => s.id === seat.id);
    if (!isSelected && selectedSeats.length >= maxSeats) {
      toast.error(`You can only select ${maxSeats} seat${maxSeats > 1 ? 's' : ''} for ${maxSeats} passenger${maxSeats > 1 ? 's' : ''}`);
      return;
    }
    toggleSeat(seat);
    if (isSelected) {
      toast(`Seat ${seat.seat_number} deselected`, { icon: '✕', duration: 1200 });
    } else {
      toast.success(`Seat ${seat.seat_number} selected!`, { duration: 1200 });
    }
  };

  const handlePayClick = () => {
    if (selectedSeats.length === 0) return toast.error('Please select at least one seat');
    if (!passengerForm.fullName || !passengerForm.passportNo || !passengerForm.nationality || !passengerForm.dob) {
      return toast.error('Please fill in all passenger details');
    }
    if (!user) {
      setPendingAction('pay');
      setShowLoginModal(true);
      return;
    }
    triggerPayment();
  };

  const triggerPayment = useCallback(async () => {
    const supabase = createClient();
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (!freshUser) {
      setPendingAction('pay');
      setShowLoginModal(true);
      return;
    }

    setLoading(true);
    try {
      const pnr = nanoid(6).toUpperCase();

      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalPrice, currency: 'INR', receipt: pnr }),
      });

      if (!orderRes.ok) throw new Error('Payment API error: ' + await orderRes.text());
      const orderData = await orderRes.json();

      const bookSeats = async () => {
        // Reserve each seat sequentially using RPC
        const results = [];
        for (let i = 0; i < selectedSeats.length; i++) {
          const seat = selectedSeats[i];
          const seatPnr = i === 0 ? pnr : nanoid(6).toUpperCase();
          const seatPrice = flight.base_price + (seat.extra_fee || 0);

          const { data, error } = await supabase.rpc('reserve_seat', {
            p_flight_id: flight.id,
            p_seat_id: seat.id,
            p_user_id: freshUser.id,
            p_total_price: seatPrice,
            p_pnr_code: seatPnr,
            p_passenger_name: passengerForm.fullName,
            p_passport_no: passengerForm.passportNo,
            p_nationality: passengerForm.nationality,
            p_dob: passengerForm.dob,
          });

          if (error || !data?.success) {
            throw new Error(`Seat ${seat.seat_number}: ${data?.error || error?.message || 'Booking failed'}`);
          }
          results.push({ bookingId: data.booking_id, pnr: seatPnr });
        }
        return results;
      };

      // Mock mode — no Razorpay keys configured
      if (orderData.mock) {
        const results = await bookSeats();
        resetBookingFlow();
        toast.success(`${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} booked! (Test mode)`);
        router.push(`/confirmation?bookingId=${results[0].bookingId}&pnr=${results[0].pnr}&date=${searchedDate || ''}&seats=${selectedSeats.length}`);
        return;
      }

      // Real Razorpay checkout
      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) throw new Error('Failed to load Razorpay. Check your connection.');

      await new Promise((resolve, reject) => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'AeroFlow',
          description: `${flight.flight_no} · ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} · ${selectedSeats.map(s => s.seat_number).join(', ')}`,
          order_id: orderData.orderId,
          prefill: { name: passengerForm.fullName, email: freshUser.email || '' },
          theme: { color: '#38a3d4' },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
          handler: async () => {
            try {
              const results = await bookSeats();
              resetBookingFlow();
              resolve(results);
            } catch (err) { reject(err); }
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }).then((results) => {
        toast.success(`${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} booked!`);
        router.push(`/confirmation?bookingId=${results[0].bookingId}&pnr=${results[0].pnr}&date=${searchedDate || ''}&seats=${selectedSeats.length}`);
      });

    } catch (err) {
      if (err.message !== 'Payment cancelled') {
        toast.error(err.message || 'Booking failed. Please try again.');
      } else {
        toast('Payment cancelled', { icon: '⚠️' });
      }
    } finally {
      setLoading(false);
    }
  }, [flight, selectedSeats, passengerForm, totalPrice, resetBookingFlow, router, searchedDate]);

  if (!flight) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--text-muted)' }}>Loading flight details...</p>
        </div>
      </div>
    );
  }

  const departs = flight.departs_at ? new Date(flight.departs_at) : null;
  const arrives = flight.arrives_at ? new Date(flight.arrives_at) : null;
  const duration = flight.duration_minutes || (departs && arrives ? differenceInMinutes(arrives, departs) : 0);

  return (
    <>
      {showLoginModal && (
        <LoginModal onSuccess={() => {}} onClose={() => { setShowLoginModal(false); setPendingAction(null); }} />
      )}

      <div className="min-h-screen px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <StepIndicator step={step} />

          {/* Flight summary bar */}
          <div className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4 justify-between" style={{ border: '1px solid rgba(56,163,212,0.2)' }}>
            <div>
              <div className="font-bold text-xl" style={{ fontFamily: 'var(--font-mono)' }}>
                {flight.origin}<span className="mx-2" style={{ color: 'var(--text-muted)' }}>→</span>{flight.destination}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {flight.flight_no} · {departs ? format(departs, 'dd MMM yyyy') : ''} · {Math.floor(duration / 60)}h {duration % 60}m
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold" style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                ₹{totalPrice.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {selectedSeats.length > 0
                  ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}: ${selectedSeats.map(s => s.seat_number).join(', ')}`
                  : `Select up to ${maxSeats} seat${maxSeats > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">

              {/* Step 1: Seat Selection */}
              {step === 1 && (
                <div className="glass-card p-6 animate-slide-up-fade">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                      Select Your Seat{maxSeats > 1 ? 's' : ''}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {selectedSeats.length}/{maxSeats} selected
                      </span>
                      {selectedSeats.length > 0 && (
                        <button
                          onClick={clearSeats}
                          className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg"
                          style={{ color: 'var(--accent-coral)', border: '1px solid rgba(232,83,58,0.3)' }}
                        >
                          <Trash2 size={11} /> Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {maxSeats > 1 && (
                    <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: 'rgba(56,163,212,0.06)', border: '1px solid rgba(56,163,212,0.2)', color: 'var(--accent-sky)' }}>
                      ℹ You searched for <strong>{maxSeats} passengers</strong> — select up to {maxSeats} seats. Click a selected seat to deselect it.
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <SeatMap
                      flightId={flight.id}
                      selectedSeats={selectedSeats}
                      onSeatSelect={handleSeatToggle}
                    />
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      disabled={selectedSeats.length === 0}
                      onClick={() => setStep(2)}
                      className="btn-primary"
                    >
                      Continue <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Passenger Details */}
              {step === 2 && (
                <div className="glass-card p-6 animate-slide-up-fade">
                  <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>Passenger Details</h2>
                  {selectedSeats.length > 1 && (
                    <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                      Lead passenger details apply to all {selectedSeats.length} seats
                    </p>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Full Name (as on passport)</label>
                      <input type="text" value={passengerForm.fullName} onChange={(e) => setPassengerForm({ fullName: e.target.value })} className="input-field" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Passport Number</label>
                      <input type="text" value={passengerForm.passportNo} onChange={(e) => setPassengerForm({ passportNo: e.target.value })} className="input-field" placeholder="A1234567" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Nationality</label>
                        <input type="text" value={passengerForm.nationality} onChange={(e) => setPassengerForm({ nationality: e.target.value })} className="input-field" placeholder="Indian" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Date of Birth</label>
                        <input type="date" value={passengerForm.dob} onChange={(e) => setPassengerForm({ dob: e.target.value })} className="input-field" style={{ colorScheme: 'dark' }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3 justify-between">
                    <button onClick={() => setStep(1)} className="btn-ghost">← Back</button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!passengerForm.fullName || !passengerForm.passportNo || !passengerForm.nationality || !passengerForm.dob}
                      className="btn-primary"
                    >
                      Review & Pay <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Pay */}
              {step === 3 && (
                <div className="glass-card p-6 animate-slide-up-fade">
                  <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Review & Pay</h2>
                  <div className="space-y-4">
                    {/* Flight info */}
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(56,163,212,0.05)', border: '1px solid var(--border-color)' }}>
                      <h3 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FLIGHT</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span style={{ color: 'var(--text-muted)' }}>Flight: </span><span className="font-mono font-bold">{flight.flight_no}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Route: </span><span className="font-bold">{flight.origin} → {flight.destination}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Date: </span>{departs ? format(departs, 'dd MMM yyyy') : ''}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Time: </span>{departs ? format(departs, 'HH:mm') : ''} – {arrives ? format(arrives, 'HH:mm') : ''}</div>
                        <div className="col-span-2">
                          <span style={{ color: 'var(--text-muted)' }}>Seats: </span>
                          <span className="font-bold">{selectedSeats.map(s => `${s.seat_number} (${s.class})`).join(' · ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Passenger */}
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(56,163,212,0.05)', border: '1px solid var(--border-color)' }}>
                      <h3 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PASSENGER</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span style={{ color: 'var(--text-muted)' }}>Name: </span>{passengerForm.fullName}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Nationality: </span>{passengerForm.nationality}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Passport: </span>{passengerForm.passportNo}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>DOB: </span>{passengerForm.dob}</div>
                      </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.2)' }}>
                      <h3 className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PRICE BREAKDOWN</h3>
                      <div className="space-y-2 text-sm">
                        {selectedSeats.map((seat) => (
                          <div key={seat.id} className="flex justify-between">
                            <span style={{ color: 'var(--text-secondary)' }}>
                              Seat {seat.seat_number} ({seat.class})
                            </span>
                            <span className="font-mono">₹{(flight.base_price + (seat.extra_fee || 0)).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="h-px mt-2" style={{ background: 'var(--border-color)' }} />
                        <div className="flex justify-between font-bold pt-1">
                          <span>Total ({selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''})</span>
                          <span className="font-mono text-lg" style={{ color: 'var(--accent-gold)' }}>₹{totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(46,196,138,0.08)', border: '1px solid rgba(46,196,138,0.2)', color: 'var(--accent-jade)' }}>
                      <strong>Razorpay Test —</strong> Card: <span className="font-mono">4111 1111 1111 1111</span> · Any future expiry · CVV: <span className="font-mono">123</span>
                    </div>

                    {!authLoading && !user && (
                      <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: 'var(--accent-gold)' }}>
                        ⚡ You&apos;ll be asked to sign in before payment — it only takes a second.
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3 justify-between">
                    <button onClick={() => setStep(2)} className="btn-ghost">← Back</button>
                    <button onClick={handlePayClick} disabled={loading} className="btn-gold">
                      {loading
                        ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />Processing...</span>
                        : <><CreditCard size={16} /> Pay ₹{totalPrice.toLocaleString()}</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  SELECTED SEATS
                </h3>
                {selectedSeats.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No seats selected yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedSeats.map((seat) => (
                      <div key={seat.id} className="flex items-center justify-between text-sm p-2 rounded-lg"
                        style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)' }}>
                        <div>
                          <span className="font-bold font-mono" style={{ color: 'var(--accent-gold)' }}>{seat.seat_number}</span>
                          <span className="ml-2 text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{seat.class}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">₹{(flight.base_price + (seat.extra_fee || 0)).toLocaleString()}</span>
                          <button onClick={() => toggleSeat(seat)} style={{ color: 'var(--accent-coral)' }}>
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                      <span>Total</span>
                      <span className="font-mono" style={{ color: 'var(--accent-gold)' }}>₹{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PAYMENT</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Secured by Razorpay</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>UPI · Cards · Net Banking · Wallets</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookingPageInner />
    </Suspense>
  );
}