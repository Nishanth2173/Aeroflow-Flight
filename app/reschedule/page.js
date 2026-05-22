'use client';

export const dynamic = 'force-dynamic';


import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plane, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import useUserStore from '@/store/userStore';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';

function formatDuration(mins) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function ReschedulePageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useUserStore();

  const bookingId = params.get('bookingId');
  const origin = params.get('origin');
  const destination = params.get('destination');

  const [booking, setBooking] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (bookingId) fetchData();
  }, [bookingId, user]);

  async function fetchData() {
    const supabase = createClient();
    // Fetch current booking
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('*, flights(*), seats(*)')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    setBooking(bookingData);

    // Fetch alternative flights on same route (excluding current flight)
    const { data: flights } = await supabase
      .from('flights')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .neq('id', bookingData?.flight_id)
      .neq('status', 'cancelled')
      .gt('departs_at', new Date().toISOString())
      .order('departs_at');

    setAlternatives(flights || []);
    setLoading(false);
  }

  const handleReschedule = async () => {
    if (!selectedFlight) return toast.error('Please select a new flight');
    setSubmitting(true);

    try {
      const supabase = createClient();
      const oldPrice = booking.total_price;
      const newPrice = selectedFlight.base_price + (booking.seats?.extra_fee || 0);
      const feeDiff = Math.max(0, newPrice - oldPrice);

      // Insert reschedule record
      const { error: rescheduleErr } = await supabase
        .from('reschedules')
        .insert({
          booking_id: bookingId,
          old_flight_id: booking.flight_id,
          new_flight_id: selectedFlight.id,
          fee_charged: feeDiff,
        });

      if (rescheduleErr) throw rescheduleErr;

      // Update booking
      const { error: bookingErr } = await supabase
        .from('bookings')
        .update({
          flight_id: selectedFlight.id,
          status: 'rescheduled',
          total_price: newPrice,
        })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (bookingErr) throw bookingErr;

      toast.success('Flight rescheduled successfully!');
      router.push('/my-bookings');
    } catch (err) {
      toast.error(err.message || 'Reschedule failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentFlight = booking?.flights;
  const currentDeparts = currentFlight ? parseISO(currentFlight.departs_at) : null;

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up-fade">
          <button
            onClick={() => router.push('/my-bookings')}
            className="text-sm mb-3 flex items-center gap-1 hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Back to bookings
          </button>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            Reschedule Flight
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Select a new flight on the same route
          </p>
        </div>

        {/* Current booking */}
        <div
          className="glass-card p-5 mb-6 animate-slide-up-fade animate-delay-100"
          style={{ border: '1px solid rgba(245,166,35,0.2)' }}
        >
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            CURRENT BOOKING
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                  {currentFlight?.origin}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {currentDeparts && format(currentDeparts, 'HH:mm dd MMM')}
                </div>
              </div>
              <Plane size={16} style={{ color: 'var(--accent-sky)', transform: 'rotate(45deg)' }} />
              <div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                  {currentFlight?.destination}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold" style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                ₹{booking?.total_price?.toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {currentFlight?.flight_no}
              </div>
            </div>
          </div>
        </div>

        {/* Alternative flights */}
        <h2 className="text-xl font-bold mb-4 animate-slide-up-fade" style={{ fontFamily: 'var(--font-display)' }}>
          Available Alternatives
        </h2>

        {alternatives.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <AlertCircle size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold mb-1">No alternative flights available</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              There are no other flights on this route at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {alternatives.map((flight, i) => {
              const dep = parseISO(flight.departs_at);
              const arr = parseISO(flight.arrives_at);
              const dur = differenceInMinutes(arr, dep);
              const priceDiff = flight.base_price + (booking?.seats?.extra_fee || 0) - booking?.total_price;
              const isSelected = selectedFlight?.id === flight.id;

              return (
                <div
                  key={flight.id}
                  className="glass-card p-5 cursor-pointer transition-all animate-slide-up-fade"
                  style={{
                    animationDelay: `${0.05 * i}s`,
                    opacity: 0,
                    border: isSelected
                      ? '1px solid rgba(56,163,212,0.6)'
                      : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(56,163,212,0.08)' : undefined,
                  }}
                  onClick={() => setSelectedFlight(isSelected ? null : flight)}
                >
                  <div className="flex flex-wrap items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                          {format(dep, 'HH:mm')}
                        </div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--accent-sky)' }}>
                          {flight.origin}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {format(dep, 'dd MMM')}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1 min-w-[60px]">
                        <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {formatDuration(dur)}
                        </div>
                        <div className="flex items-center gap-1 w-full">
                          <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                          <Plane size={12} style={{ color: 'var(--accent-sky)', transform: 'rotate(45deg)' }} />
                          <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Direct</div>
                      </div>

                      <div>
                        <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                          {format(arr, 'HH:mm')}
                        </div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--accent-sky)' }}>
                          {flight.destination}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {flight.flight_no}
                      </div>
                      <div className="font-bold" style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
                        ₹{(flight.base_price + (booking?.seats?.extra_fee || 0)).toLocaleString()}
                      </div>
                      {priceDiff > 0 && (
                        <div className="text-xs" style={{ color: 'var(--accent-coral)' }}>
                          +₹{priceDiff.toLocaleString()} extra
                        </div>
                      )}
                      {priceDiff < 0 && (
                        <div className="text-xs" style={{ color: 'var(--accent-jade)' }}>
                          Save ₹{Math.abs(priceDiff).toLocaleString()}
                        </div>
                      )}
                      {priceDiff === 0 && (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Same price</div>
                      )}
                    </div>

                    {/* Selection indicator */}
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: isSelected ? 'var(--accent-sky)' : 'var(--border-color)',
                        background: isSelected ? 'var(--accent-sky)' : 'transparent',
                      }}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirm button */}
        {selectedFlight && (
          <div
            className="glass-card p-5 animate-slide-up-fade"
            style={{ border: '1px solid rgba(56,163,212,0.3)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">
                  New flight: <span className="font-mono" style={{ color: 'var(--accent-sky)' }}>{selectedFlight.flight_no}</span>
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {format(parseISO(selectedFlight.departs_at), 'HH:mm dd MMM yyyy')}
                </p>
                {(() => {
                  const priceDiff = selectedFlight.base_price + (booking?.seats?.extra_fee || 0) - booking?.total_price;
                  return priceDiff > 0 ? (
                    <p className="text-xs mt-1" style={{ color: 'var(--accent-coral)' }}>
                      Additional charge: ₹{priceDiff.toLocaleString()}
                    </p>
                  ) : null;
                })()}
              </div>
              <button
                onClick={handleReschedule}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Rescheduling...
                  </span>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Confirm Reschedule
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReschedulePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ReschedulePageInner />
    </Suspense>
  );
}