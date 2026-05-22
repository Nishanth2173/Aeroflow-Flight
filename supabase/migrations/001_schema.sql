-- ============================================================
-- Flight Management App - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FLIGHTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.flights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flight_no VARCHAR(10) NOT NULL UNIQUE,
  origin VARCHAR(3) NOT NULL,
  destination VARCHAR(3) NOT NULL,
  departs_at TIMESTAMPTZ NOT NULL,
  arrives_at TIMESTAMPTZ NOT NULL,
  aircraft_type VARCHAR(50) NOT NULL DEFAULT 'Boeing 737',
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','boarding','departed','arrived','cancelled','delayed')),
  base_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEATS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE CASCADE,
  seat_number VARCHAR(5) NOT NULL,
  class VARCHAR(10) NOT NULL CHECK (class IN ('economy','business','first')),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  extra_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flight_id, seat_number)
);

-- ============================================================
-- BOOKINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES public.flights(id),
  seat_id UUID NOT NULL REFERENCES public.seats(id),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','rescheduled','cancelled')),
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  total_price DECIMAL(10,2) NOT NULL,
  pnr_code VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PASSENGERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.passengers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  passport_no VARCHAR(20) NOT NULL,
  nationality VARCHAR(50) NOT NULL,
  dob DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RESCHEDULES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reschedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  old_flight_id UUID NOT NULL REFERENCES public.flights(id),
  new_flight_id UUID NOT NULL REFERENCES public.flights(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  fee_charged DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reschedules ENABLE ROW LEVEL SECURITY;

-- Flights: everyone can read
CREATE POLICY "flights_read_all" ON public.flights FOR SELECT USING (true);

-- Seats: everyone can read
CREATE POLICY "seats_read_all" ON public.seats FOR SELECT USING (true);

-- Bookings: users can only see/manage their own
CREATE POLICY "bookings_user_select" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookings_user_insert" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_user_update" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);

-- Passengers: users can only see/manage their own (via booking)
CREATE POLICY "passengers_user_select" ON public.passengers FOR SELECT
  USING (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));
CREATE POLICY "passengers_user_insert" ON public.passengers FOR INSERT
  WITH CHECK (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));

-- Reschedules: users can only see/manage their own (via booking)
CREATE POLICY "reschedules_user_select" ON public.reschedules FOR SELECT
  USING (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));
CREATE POLICY "reschedules_user_insert" ON public.reschedules FOR INSERT
  WITH CHECK (booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid()));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_flights_route ON public.flights(origin, destination);
CREATE INDEX IF NOT EXISTS idx_flights_departs ON public.flights(departs_at);
CREATE INDEX IF NOT EXISTS idx_seats_flight ON public.seats(flight_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_flight ON public.bookings(flight_id);
CREATE INDEX IF NOT EXISTS idx_passengers_booking ON public.passengers(booking_id);

-- ============================================================
-- RPC: SEAT RESERVATION (prevents double-booking race conditions)
-- ============================================================
CREATE OR REPLACE FUNCTION public.reserve_seat(
  p_flight_id UUID,
  p_seat_id UUID,
  p_user_id UUID,
  p_total_price DECIMAL,
  p_pnr_code VARCHAR,
  p_passenger_name VARCHAR,
  p_passport_no VARCHAR,
  p_nationality VARCHAR,
  p_dob DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_seat_available BOOLEAN;
  v_result JSON;
BEGIN
  -- Lock the seat row to prevent concurrent booking
  SELECT is_available INTO v_seat_available
  FROM public.seats
  WHERE id = p_seat_id AND flight_id = p_flight_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Seat not found');
  END IF;

  IF NOT v_seat_available THEN
    RETURN json_build_object('success', false, 'error', 'Seat is no longer available');
  END IF;

  -- Mark seat as unavailable
  UPDATE public.seats SET is_available = FALSE WHERE id = p_seat_id;

  -- Create booking
  INSERT INTO public.bookings (user_id, flight_id, seat_id, total_price, pnr_code)
  VALUES (p_user_id, p_flight_id, p_seat_id, p_total_price, p_pnr_code)
  RETURNING id INTO v_booking_id;

  -- Create passenger record
  INSERT INTO public.passengers (booking_id, full_name, passport_no, nationality, dob)
  VALUES (v_booking_id, p_passenger_name, p_passport_no, p_nationality, p_dob);

  RETURN json_build_object('success', true, 'booking_id', v_booking_id);
EXCEPTION
  WHEN lock_not_available THEN
    RETURN json_build_object('success', false, 'error', 'Seat is being booked by another user. Please try again.');
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- ============================================================
-- RPC: CANCEL BOOKING (atomic seat release + 2-hour rule)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_flight_departs TIMESTAMPTZ;
  v_seat_id UUID;
  v_booking_status VARCHAR;
BEGIN
  -- Fetch booking details
  SELECT b.seat_id, b.status, f.departs_at
  INTO v_seat_id, v_booking_status, v_flight_departs
  FROM public.bookings b
  JOIN public.flights f ON f.id = b.flight_id
  WHERE b.id = p_booking_id AND b.user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;

  IF v_booking_status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Booking is already cancelled');
  END IF;

  -- Enforce 2-hour cancellation window
  IF v_flight_departs - NOW() < INTERVAL '2 hours' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot cancel within 2 hours of departure');
  END IF;

  -- Cancel booking and free seat atomically
  UPDATE public.bookings SET status = 'cancelled' WHERE id = p_booking_id;
  UPDATE public.seats SET is_available = TRUE WHERE id = v_seat_id;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- DB TRIGGER: Block cancellations within 2 hours (DB level enforcement)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_cancellation_window()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_departs_at TIMESTAMPTZ;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    SELECT departs_at INTO v_departs_at
    FROM public.flights WHERE id = OLD.flight_id;

    IF v_departs_at - NOW() < INTERVAL '2 hours' THEN
      RAISE EXCEPTION 'Cancellations are not allowed within 2 hours of departure';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_cancellation_window
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_cancellation_window();
