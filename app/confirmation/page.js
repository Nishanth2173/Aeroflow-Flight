'use client';

export const dynamic = 'force-dynamic';


import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Plane, BookOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import useFlightStore from '@/store/flightStore';

// Reconstruct real depart/arrive from booking date + flight time fields
function buildRealTimes(flight, bookedAt) {
  if (!flight) return { departs: null, arrives: null };

  // Use booked_at date as the travel date reference
  // (In real app you'd store travel_date on the booking — for now use booked_at date)
  // Better: use the URL param date if available
  const travelDate = bookedAt ? new Date(bookedAt) : new Date();

  if (flight.depart_time && flight.arrive_time) {
    const [dH, dM] = flight.depart_time.split(':');
    const [aH, aM] = flight.arrive_time.split(':');

    const departs = new Date(travelDate);
    departs.setHours(+dH, +dM, 0, 0);

    const arrives = new Date(travelDate);
    arrives.setHours(+aH, +aM, 0, 0);
    if (arrives <= departs) arrives.setDate(arrives.getDate() + 1);

    return { departs, arrives };
  }

  // Fallback: use departs_at only if it's not the placeholder year 2000
  const raw = flight.departs_at ? new Date(flight.departs_at) : null;
  const rawArr = flight.arrives_at ? new Date(flight.arrives_at) : null;
  if (raw && raw.getFullYear() === 2000) return { departs: null, arrives: null };
  return { departs: raw, arrives: rawArr };
}

function ConfirmationPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get('bookingId');
  const pnr = params.get('pnr');
  // Travel date passed from booking page via URL
  const travelDate = params.get('date');
  const { resetBookingFlow } = useFlightStore();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    resetBookingFlow();
    if (bookingId) fetchBooking();
  }, [bookingId]);

  async function fetchBooking() {
    const supabase = createClient();
    const { data } = await supabase
      .from('bookings')
      .select('*, flights(*), seats(*), passengers(*)')
      .eq('id', bookingId)
      .single();
    setBooking(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-jade-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--text-muted)' }}>Loading confirmation...</p>
        </div>
      </div>
    );
  }

  const flight = booking?.flights;
  const seat = booking?.seats;
  const passenger = booking?.passengers?.[0];

  // Use travelDate from URL param first, fallback to booked_at date
  const refDate = travelDate
    ? new Date(travelDate)
    : booking?.booked_at
      ? new Date(booking.booked_at)
      : new Date();

  const { departs, arrives } = buildRealTimes(flight, refDate);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Success header */}
        <div className="text-center mb-8 animate-slide-up-fade">
          <div
            className="inline-flex w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{
              background: 'rgba(46,196,138,0.15)',
              border: '2px solid rgba(46,196,138,0.4)',
              boxShadow: '0 0 40px rgba(46,196,138,0.2)',
            }}
          >
            <CheckCircle size={36} style={{ color: '#2ec48a' }} />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Booking Confirmed!
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Your seat is reserved. Safe travels!
          </p>
        </div>

        {/* PNR card */}
        <div
          className="glass-card p-8 mb-6 text-center animate-slide-up-fade animate-delay-100"
          style={{
            background: 'linear-gradient(135deg, rgba(15,32,64,0.9), rgba(10,22,40,0.95))',
            border: '1px solid rgba(245,166,35,0.3)',
          }}
        >
          <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Booking Reference
          </p>
          <div className="pnr-display mb-2">
            {booking?.pnr_code || pnr}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Present this code at the check-in counter
          </p>
        </div>

        {/* Flight details */}
        {flight && (
          <div className="glass-card p-6 mb-6 animate-slide-up-fade animate-delay-200">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Flight Details
            </h2>

            {/* Route row */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                  {flight.origin}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--accent-sky)' }}>
                  {flight.depart_time?.slice(0, 5) || (departs ? format(departs, 'HH:mm') : '—')}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 flex-1 mx-4">
                <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {flight.flight_no}
                </div>
                <div className="w-full flex items-center gap-2">
                  <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                  <Plane size={16} style={{ color: 'var(--accent-sky)', transform: 'rotate(45deg)' }} />
                  <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Direct</div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                  {flight.destination}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--accent-sky)' }}>
                  {flight.arrive_time?.slice(0, 5) || (arrives ? format(arrives, 'HH:mm') : '—')}
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                {
                  label: 'Date',
                  // Show actual travel date — never the DB placeholder
                  value: departs
                    ? format(departs, 'dd MMM yyyy')
                    : format(refDate, 'dd MMM yyyy'),
                },
                { label: 'Seat', value: seat ? `${seat.seat_number} (${seat.class})` : '—' },
                { label: 'Aircraft', value: flight.aircraft_type },
                { label: 'Status', value: booking?.status },
                { label: 'Total Paid', value: `₹${booking?.total_price?.toLocaleString()}` },
                {
                  label: 'Booked',
                  value: booking?.booked_at
                    ? format(parseISO(booking.booked_at), 'dd MMM HH:mm')
                    : '—',
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(56,163,212,0.05)', border: '1px solid var(--border-color)' }}
                >
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
                  <div className="font-semibold capitalize">{value}</div>
                </div>
              ))}
            </div>

            {/* Passenger */}
            {passenger && (
              <div
                className="mt-4 p-4 rounded-xl"
                style={{ background: 'rgba(56,163,212,0.05)', border: '1px solid var(--border-color)' }}
              >
                <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Passenger
                </p>
                <p className="font-bold">{passenger.full_name}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {passenger.nationality} · DOB: {passenger.dob}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 animate-slide-up-fade animate-delay-300">
          <button onClick={() => router.push('/my-bookings')} className="btn-primary flex-1 justify-center">
            <BookOpen size={16} />
            My Bookings
          </button>
          <button onClick={() => router.push('/search')} className="btn-ghost flex-1 justify-center">
            <Plane size={16} />
            Book Another
          </button>
        </div>

      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-jade-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConfirmationPageInner />
    </Suspense>
  );
}