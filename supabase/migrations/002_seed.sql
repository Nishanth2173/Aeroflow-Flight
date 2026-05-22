-- ============================================================
-- Migration: Add time-only columns for dynamic daily flights
-- Run this in Supabase SQL Editor AFTER 001_schema.sql
-- ============================================================

-- Add time columns to flights
ALTER TABLE public.flights
  ADD COLUMN IF NOT EXISTS depart_time TIME,
  ADD COLUMN IF NOT EXISTS arrive_time TIME,
  ADD COLUMN IF NOT EXISTS duration_minutes INT;

-- ============================================================
-- Re-seed flights with time-only data (no specific date)
-- departs_at / arrives_at set to 2000-01-01 as placeholder
-- ============================================================
DELETE FROM public.seats WHERE flight_id IN (
  SELECT id FROM public.flights WHERE flight_no LIKE 'FM%'
);
DELETE FROM public.flights WHERE flight_no LIKE 'FM%';

INSERT INTO public.flights (id, flight_no, origin, destination, departs_at, arrives_at, depart_time, arrive_time, duration_minutes, aircraft_type, status, base_price)
VALUES
  -- BOM → DEL
  ('f1000000-0000-0000-0000-000000000001','FM101','BOM','DEL','2000-01-01 06:00:00+05:30','2000-01-01 08:10:00+05:30','06:00','08:10',130,'Boeing 737','scheduled',4500.00),
  ('f1000000-0000-0000-0000-000000000002','FM102','BOM','DEL','2000-01-01 10:30:00+05:30','2000-01-01 12:40:00+05:30','10:30','12:40',130,'Airbus A320','scheduled',5200.00),
  ('f1000000-0000-0000-0000-000000000009','FM103','BOM','DEL','2000-01-01 14:00:00+05:30','2000-01-01 16:10:00+05:30','14:00','16:10',130,'Boeing 737','scheduled',4800.00),
  ('f1000000-0000-0000-0000-000000000010','FM104','BOM','DEL','2000-01-01 19:30:00+05:30','2000-01-01 21:40:00+05:30','19:30','21:40',130,'Airbus A321','scheduled',4200.00),

  -- DEL → BLR
  ('f1000000-0000-0000-0000-000000000003','FM201','DEL','BLR','2000-01-01 07:00:00+05:30','2000-01-01 09:45:00+05:30','07:00','09:45',165,'Boeing 737','scheduled',5800.00),
  ('f1000000-0000-0000-0000-000000000004','FM202','DEL','BLR','2000-01-01 11:30:00+05:30','2000-01-01 14:15:00+05:30','11:30','14:15',165,'Airbus A321','scheduled',6400.00),
  ('f1000000-0000-0000-0000-000000000011','FM203','DEL','BLR','2000-01-01 16:00:00+05:30','2000-01-01 18:45:00+05:30','16:00','18:45',165,'Boeing 737','scheduled',5500.00),
  ('f1000000-0000-0000-0000-000000000012','FM204','DEL','BLR','2000-01-01 20:30:00+05:30','2000-01-01 23:15:00+05:30','20:30','23:15',165,'Airbus A320','scheduled',6100.00),

  -- BLR → HYD
  ('f1000000-0000-0000-0000-000000000005','FM301','BLR','HYD','2000-01-01 07:00:00+05:30','2000-01-01 08:20:00+05:30','07:00','08:20',80,'ATR 72','scheduled',2800.00),
  ('f1000000-0000-0000-0000-000000000006','FM302','BLR','HYD','2000-01-01 11:00:00+05:30','2000-01-01 12:20:00+05:30','11:00','12:20',80,'Boeing 737','scheduled',3100.00),
  ('f1000000-0000-0000-0000-000000000013','FM303','BLR','HYD','2000-01-01 15:30:00+05:30','2000-01-01 16:50:00+05:30','15:30','16:50',80,'ATR 72','scheduled',2600.00),
  ('f1000000-0000-0000-0000-000000000014','FM304','BLR','HYD','2000-01-01 19:00:00+05:30','2000-01-01 20:20:00+05:30','19:00','20:20',80,'Boeing 737','scheduled',3300.00),

  -- HYD → BOM
  ('f1000000-0000-0000-0000-000000000007','FM401','HYD','BOM','2000-01-01 06:30:00+05:30','2000-01-01 08:10:00+05:30','06:30','08:10',100,'Airbus A320','scheduled',3600.00),
  ('f1000000-0000-0000-0000-000000000008','FM402','HYD','BOM','2000-01-01 12:00:00+05:30','2000-01-01 13:40:00+05:30','12:00','13:40',100,'Boeing 737','scheduled',3900.00),
  ('f1000000-0000-0000-0000-000000000015','FM403','HYD','BOM','2000-01-01 16:30:00+05:30','2000-01-01 18:10:00+05:30','16:30','18:10',100,'Airbus A320','scheduled',3400.00),
  ('f1000000-0000-0000-0000-000000000016','FM404','HYD','BOM','2000-01-01 20:00:00+05:30','2000-01-01 21:40:00+05:30','20:00','21:40',100,'Boeing 737','scheduled',4100.00);

-- ============================================================
-- Generate seat maps
-- ============================================================
DO $$
DECLARE
  flight_ids UUID[] := ARRAY[
    'f1000000-0000-0000-0000-000000000001'::UUID,
    'f1000000-0000-0000-0000-000000000002'::UUID,
    'f1000000-0000-0000-0000-000000000003'::UUID,
    'f1000000-0000-0000-0000-000000000004'::UUID,
    'f1000000-0000-0000-0000-000000000005'::UUID,
    'f1000000-0000-0000-0000-000000000006'::UUID,
    'f1000000-0000-0000-0000-000000000007'::UUID,
    'f1000000-0000-0000-0000-000000000008'::UUID,
    'f1000000-0000-0000-0000-000000000009'::UUID,
    'f1000000-0000-0000-0000-000000000010'::UUID,
    'f1000000-0000-0000-0000-000000000011'::UUID,
    'f1000000-0000-0000-0000-000000000012'::UUID,
    'f1000000-0000-0000-0000-000000000013'::UUID,
    'f1000000-0000-0000-0000-000000000014'::UUID,
    'f1000000-0000-0000-0000-000000000015'::UUID,
    'f1000000-0000-0000-0000-000000000016'::UUID
  ];
  fid UUID;
  row_num INT;
  col CHAR;
  cols CHAR[]       := ARRAY['A','B','C','D','E','F'];
  first_cols CHAR[] := ARRAY['A','B','C','D'];
BEGIN
  FOREACH fid IN ARRAY flight_ids LOOP
    FOR row_num IN 1..2 LOOP
      FOREACH col IN ARRAY first_cols LOOP
        INSERT INTO public.seats (flight_id, seat_number, class, is_available, extra_fee)
        VALUES (fid, row_num::TEXT || col, 'first', TRUE, 8000.00);
      END LOOP;
    END LOOP;
    FOR row_num IN 3..6 LOOP
      FOREACH col IN ARRAY cols LOOP
        INSERT INTO public.seats (flight_id, seat_number, class, is_available, extra_fee)
        VALUES (fid, row_num::TEXT || col, 'business', TRUE, 3500.00);
      END LOOP;
    END LOOP;
    FOR row_num IN 7..30 LOOP
      FOREACH col IN ARRAY cols LOOP
        INSERT INTO public.seats (flight_id, seat_number, class, is_available, extra_fee)
        VALUES (fid, row_num::TEXT || col, 'economy', TRUE, 0.00);
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;