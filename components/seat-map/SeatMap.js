'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const CLASS_CONFIG = {
  first:    { label: 'First Class', color: 'var(--accent-gold)',  bg: 'rgba(245,166,35,0.1)',   rows: [1, 2],                                   cols: ['A','B','C','D'] },
  business: { label: 'Business',    color: '#a78bfa',             bg: 'rgba(167,139,250,0.1)', rows: Array.from({ length: 4  }, (_, i) => i + 3), cols: ['A','B','C','D','E','F'] },
  economy:  { label: 'Economy',     color: 'var(--accent-jade)',  bg: 'rgba(46,196,138,0.1)',  rows: Array.from({ length: 24 }, (_, i) => i + 7), cols: ['A','B','C','D','E','F'] },
};

function SeatButton({ seat, isSelected, isYours, onSelect }) {
  const [showTip, setShowTip] = useState(false);

  const getClass = () => {
    if (isYours)    return `seat seat-your seat-${seat.class}`;
    if (isSelected) return `seat seat-selected seat-${seat.class}`;
    if (!seat.is_available) return `seat seat-occupied seat-${seat.class}`;
    return `seat seat-available seat-${seat.class}`;
  };

  return (
    <div className="relative" style={{ display: 'inline-block' }}>
      <button
        className={getClass()}
        disabled={!seat.is_available && !isYours}
        onClick={() => seat.is_available && onSelect(seat)}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        {seat.seat_number}
      </button>
      {showTip && (
        <div className="tooltip">
          <div className="font-semibold">{seat.seat_number}</div>
          <div style={{ textTransform: 'capitalize' }}>{seat.class}</div>
          {seat.extra_fee > 0 && <div>+₹{seat.extra_fee.toLocaleString()}</div>}
          <div style={{ color: isSelected ? '#f5a623' : 'inherit' }}>
            {isYours ? 'Your seat' : isSelected ? '✓ Selected' : seat.is_available ? 'Available' : 'Occupied'}
          </div>
        </div>
      )}
    </div>
  );
}

// selectedSeats = array of seat objects
// onSeatSelect  = (seat) => void  — parent toggles in/out of array
export default function SeatMap({ flightId, selectedSeats = [], onSeatSelect, yourSeatIds = [] }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!flightId) return;
    const supabase = createClient();

    supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('seat_number')
      .then(({ data }) => { setSeats(data || []); setLoading(false); });

    // Realtime — update availability live
    const channel = supabase
      .channel(`seats-${flightId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'seats', filter: `flight_id=eq.${flightId}` },
        (payload) => {
          setSeats(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [flightId]);

  const seatMap = {};
  seats.forEach(s => { seatMap[s.seat_number] = s; });

  const selectedIds  = new Set(selectedSeats.map(s => s.id));
  const yourSeatSet  = new Set(yourSeatIds);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading seat map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
        {[
          { cls: 'seat-available', label: 'Available' },
          { cls: 'seat-selected',  label: 'Selected'  },
          { cls: 'seat-occupied',  label: 'Occupied'  },
          ...(yourSeatIds.length ? [{ cls: 'seat-your', label: 'Your Seat' }] : []),
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`seat w-6 h-6 ${cls}`} style={{ cursor: 'default', fontSize: '0' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Selected count pill */}
      {selectedSeats.length > 0 && (
        <div
          className="mb-4 px-3 py-2 rounded-xl text-sm flex items-center gap-2"
          style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)', color: 'var(--accent-gold)' }}
        >
          <span className="font-bold font-mono">{selectedSeats.length}</span>
          seat{selectedSeats.length > 1 ? 's' : ''} selected:&nbsp;
          <span className="font-mono">{selectedSeats.map(s => s.seat_number).join(', ')}</span>
          <span className="ml-auto" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Click a selected seat to deselect
          </span>
        </div>
      )}

      {/* Front label */}
      <div className="flex justify-center mb-4">
        <div className="text-xs font-semibold px-4 py-1 rounded-full"
          style={{ background: 'rgba(56,163,212,0.1)', color: 'var(--accent-sky)', border: '1px solid rgba(56,163,212,0.2)', fontFamily: 'var(--font-mono)' }}>
          ✈ FRONT OF AIRCRAFT
        </div>
      </div>

      <div className="min-w-max mx-auto">
        {Object.entries(CLASS_CONFIG).map(([cls, config]) => (
          <div key={cls} className="mb-6">
            <div
              className="flex items-center gap-2 mb-3 py-1 px-3 rounded-lg text-xs font-bold uppercase tracking-widest"
              style={{ background: config.bg, color: config.color, fontFamily: 'var(--font-mono)', border: `1px solid ${config.color}30` }}
            >
              {config.label}
            </div>

            <div className="space-y-2">
              {config.rows.map(row => (
                <div key={row} className="flex items-center gap-2">
                  <span className="w-6 text-center text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {row}
                  </span>

                  {/* Left seats */}
                  <div className="flex gap-1">
                    {config.cols.slice(0, 3).map(col => {
                      const seat = seatMap[`${row}${col}`];
                      if (!seat) return <div key={col} className="w-8 h-8" />;
                      return (
                        <SeatButton
                          key={col}
                          seat={seat}
                          isSelected={selectedIds.has(seat.id)}
                          isYours={yourSeatSet.has(seat.id)}
                          onSelect={onSeatSelect}
                        />
                      );
                    })}
                  </div>

                  {/* Aisle */}
                  <div className="w-6" />

                  {/* Right seats */}
                  <div className="flex gap-1">
                    {config.cols.slice(3).map(col => {
                      const seat = seatMap[`${row}${col}`];
                      if (!seat) return <div key={col} className="w-8 h-8" />;
                      return (
                        <SeatButton
                          key={col}
                          seat={seat}
                          isSelected={selectedIds.has(seat.id)}
                          isYours={yourSeatSet.has(seat.id)}
                          onSelect={onSeatSelect}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}