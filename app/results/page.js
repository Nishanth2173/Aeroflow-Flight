'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plane, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import useFlightStore from '@/store/flightStore';
import { format, parse } from 'date-fns';

function formatDuration(mins) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// Combine searched date + flight's time fields into real DateTime strings
function buildFlightWithDate(flight, date) {
  const [departH, departM] = flight.depart_time.split(':');
  const [arriveH, arriveM] = flight.arrive_time.split(':');

  const departs = new Date(date);
  departs.setHours(Number(departH), Number(departM), 0, 0);

  const arrives = new Date(date);
  arrives.setHours(Number(arriveH), Number(arriveM), 0, 0);
  // handle overnight flights
  if (arrives <= departs) arrives.setDate(arrives.getDate() + 1);

  return { ...flight, departs_at: departs.toISOString(), arrives_at: arrives.toISOString() };
}

function FlightCard({ flight, onSelect, selectedClass }) {
  const departs = new Date(flight.departs_at);
  const arrives = new Date(flight.arrives_at);
  const duration = flight.duration_minutes;

  const classPrice =
    selectedClass === 'business' ? flight.base_price + 3500 :
    selectedClass === 'first'    ? flight.base_price + 8000 :
    flight.base_price;

  return (
    <div
      className="glass-card glass-card-hover p-5 md:p-6 cursor-pointer animate-slide-up-fade"
      onClick={() => onSelect(flight)}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-semibold px-2 py-1 rounded"
              style={{ background: 'rgba(56,163,212,0.1)', color: 'var(--accent-sky)', fontFamily: 'var(--font-mono)' }}
            >
              {flight.flight_no}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{flight.aircraft_type}</span>
            <span className="badge badge-scheduled">{flight.status}</span>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                {format(departs, 'HH:mm')}
              </div>
              <div className="text-lg font-semibold" style={{ color: 'var(--accent-sky)' }}>{flight.origin}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(departs, 'dd MMM yyyy')}</div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {formatDuration(duration)}
              </div>
              <div className="w-full flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                <Plane size={14} style={{ color: 'var(--accent-sky)', transform: 'rotate(45deg)', flexShrink: 0 }} />
                <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Direct</div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                {format(arrives, 'HH:mm')}
              </div>
              <div className="text-lg font-semibold" style={{ color: 'var(--accent-sky)' }}>{flight.destination}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{format(arrives, 'dd MMM yyyy')}</div>
            </div>
          </div>
        </div>

        <div className="hidden md:block w-px h-16 mx-2" style={{ background: 'var(--border-color)' }} />

        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 min-w-[140px]">
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>
              ₹{classPrice.toLocaleString()}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              per passenger · {selectedClass}
            </div>
          </div>
          <button
            className="btn-primary py-2 px-5 text-sm"
            onClick={(e) => { e.stopPropagation(); onSelect(flight); }}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { setSelectedFlight, setSearchQuery } = useFlightStore();

  const origin        = params.get('origin');
  const destination   = params.get('destination');
  const date          = params.get('date');
  const passengers    = params.get('passengers') || 1;
  const selectedClass = params.get('class') || 'economy';

  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (origin && destination && date) {
      setSearchQuery({ origin, destination, date, passengerCount: Number(passengers), class: selectedClass });
      fetchFlights();
    }
  }, [origin, destination, date]);

  async function fetchFlights() {
    setLoading(true);
    const supabase = createClient();

    // Fetch all flights on this route (date is applied client-side)
    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .neq('status', 'cancelled')
      .order('depart_time');  // sort by departure time

    if (!error && data) {
      // Inject the searched date into each flight's times
      const withDates = data.map(f => buildFlightWithDate(f, date));
      setFlights(withDates);
    }
    setLoading(false);
  }

  const handleSelect = (flight) => {
    setSelectedFlight(flight);
    router.push(`/booking?flightId=${flight.id}&date=${date}`);
  };

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-slide-up-fade">
          <button
            onClick={() => router.push('/search')}
            className="text-sm flex items-center gap-1 mb-2 hover:underline"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Back to search
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'var(--font-display)' }}>
            <span style={{ color: 'var(--accent-sky)' }}>{origin}</span>
            <Plane size={20} style={{ color: 'var(--text-muted)', transform: 'rotate(45deg)' }} />
            <span style={{ color: 'var(--accent-sky)' }}>{destination}</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {date ? new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            {' · '}{passengers} Passenger{passengers > 1 ? 's' : ''} · {selectedClass}
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="glass-card p-6 shimmer h-32" />)}
          </div>
        ) : flights.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <AlertCircle size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-xl font-semibold mb-2">No flights found</h2>
            <p style={{ color: 'var(--text-secondary)' }}>No flights available for this route.</p>
            <button onClick={() => router.push('/search')} className="btn-primary mt-6">Search Again</button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {flights.length} flight{flights.length !== 1 ? 's' : ''} available on this date
            </p>
            {flights.map(flight => (
              <FlightCard
                key={flight.id}
                flight={flight}
                onSelect={handleSelect}
                selectedClass={selectedClass}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}