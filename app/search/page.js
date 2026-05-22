'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plane, ArrowLeftRight, Calendar, Users, Search as SearchIcon } from 'lucide-react';
import useFlightStore from '@/store/flightStore';
import toast from 'react-hot-toast';

const AIRPORTS = [
  { code: 'BOM', name: 'Mumbai', full: 'Chhatrapati Shivaji International' },
  { code: 'DEL', name: 'Delhi', full: 'Indira Gandhi International' },
  { code: 'BLR', name: 'Bangalore', full: 'Kempegowda International' },
  { code: 'HYD', name: 'Hyderabad', full: 'Rajiv Gandhi International' },
];

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { searchQuery, setSearchQuery } = useFlightStore();

  useEffect(() => {
    const origin = params.get('origin');
    const destination = params.get('destination');
    if (origin) setSearchQuery({ origin });
    if (destination) setSearchQuery({ destination });
  }, [params]);

  const swap = () => {
    setSearchQuery({ origin: searchQuery.destination, destination: searchQuery.origin });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.origin || !searchQuery.destination) return toast.error('Please select origin and destination');
    if (searchQuery.origin === searchQuery.destination) return toast.error('Origin and destination must differ');
    if (!searchQuery.date) return toast.error('Please select a date');
    router.push(`/results?origin=${searchQuery.origin}&destination=${searchQuery.destination}&date=${searchQuery.date}&passengers=${searchQuery.passengerCount}&class=${searchQuery.class}`);
  };

  const today = new Date().toISOString().split('T')[0]; // any future date works

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-up-fade">
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Find Your Flight
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Search across all available routes and book with confidence
          </p>
        </div>

        {/* Search card */}
        <div
          className="glass-card p-6 md:p-8 animate-slide-up-fade animate-delay-100"
          style={{ border: '1px solid rgba(56,163,212,0.2)' }}
        >
          <form onSubmit={handleSearch} className="space-y-6">

            {/* Origin / Destination */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  From
                </label>
                <div className="relative">
                  <Plane
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)', transform: 'translateY(-50%) rotate(45deg)', zIndex: 1 }}
                  />
                  <select
                    value={searchQuery.origin}
                    onChange={(e) => setSearchQuery({ origin: e.target.value })}
                    className="input-field appearance-none"
                    style={{ paddingLeft: '2.25rem' }}
                  >
                    <option value="">Select origin</option>
                    {AIRPORTS.map(a => (
                      <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap button */}
              <button
                type="button"
                onClick={swap}
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 self-end mb-0.5"
                style={{
                  background: 'rgba(56,163,212,0.1)',
                  border: '1px solid rgba(56,163,212,0.3)',
                  color: 'var(--accent-sky)',
                }}
              >
                <ArrowLeftRight size={15} />
              </button>

              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  To
                </label>
                <div className="relative">
                  <Plane
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)', transform: 'translateY(-50%) rotate(225deg)', zIndex: 1 }}
                  />
                  <select
                    value={searchQuery.destination}
                    onChange={(e) => setSearchQuery({ destination: e.target.value })}
                    className="input-field appearance-none"
                    style={{ paddingLeft: '2.25rem' }}
                  >
                    <option value="">Select destination</option>
                    {AIRPORTS.map(a => (
                      <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Date / Passengers / Class */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Date
                </label>
                <div className="relative">
                  <Calendar
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)', zIndex: 1 }}
                  />
                  <input
                    type="date"
                    min={today}
                    value={searchQuery.date}
                    onChange={(e) => setSearchQuery({ date: e.target.value })}
                    className="input-field"
                    style={{ paddingLeft: '2.25rem', colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Passengers
                </label>
                <div className="relative">
                  <Users
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-muted)', zIndex: 1 }}
                  />
                  <select
                    value={searchQuery.passengerCount}
                    onChange={(e) => setSearchQuery({ passengerCount: Number(e.target.value) })}
                    className="input-field appearance-none"
                    style={{ paddingLeft: '2.25rem' }}
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Class
                </label>
                <select
                  value={searchQuery.class}
                  onChange={(e) => setSearchQuery({ class: e.target.value })}
                  className="input-field appearance-none"
                >
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-gold w-full justify-center py-4 text-base">
              <SearchIcon size={18} />
              Search Available Flights
            </button>
          </form>
        </div>

        {/* Airport info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 animate-slide-up-fade animate-delay-200">
          {AIRPORTS.map(({ code, name, full }) => (
            <div key={code} className="glass-card p-4">
              <div className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-sky)' }}>
                {code}
              </div>
              <div className="text-sm font-semibold">{name}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{full}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}