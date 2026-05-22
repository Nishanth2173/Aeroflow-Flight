# ✈ AeroFlow — Flight Management PWA

A production-grade, fully responsive Flight Management web app built with **Next.js 14**, **Supabase**, **Zustand**, and **Tailwind CSS**. Passengers can search flights, select seats, book, reschedule, and cancel — with real-time seat updates and PWA offline support.

---

## 🚀 Local Setup

### 1. Prerequisites

- Node.js 18+
- A Supabase project (free tier works)

### 2. Clone & Install

```bash
git clone <your-repo-url>
cd flight-app
npm install
```

### 3. Configure Environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Get these from: **Supabase Dashboard → Your Project → Settings → API**

### 4. Run Supabase Migrations

Go to your Supabase project → **SQL Editor**, then run:

**Step 1:** Paste and run the contents of `/supabase/migrations/001_schema.sql`

- Creates all tables (flights, seats, bookings, passengers, reschedules)
- Enables Row Level Security (RLS) on all tables
- Creates RLS policies
- Creates `reserve_seat` RPC (prevents double-booking)
- Creates `cancel_booking` RPC (atomic cancellation)
- Creates trigger to block cancellations within 2 hours of departure

**Step 2:** Paste and run the contents of `/supabase/migrations/002_seed.sql`

- Seeds 8 flights across 4 routes
- Generates full seat maps (176 seats/flight: 8 first, 24 business, 144 economy)
- Pre-occupies some seats for realism

### 5. Create Test User

In Supabase Dashboard → **Authentication → Users → Add user**:

```
Email:    test@aeroflow.dev
Password: TestPass123!
```

Or register from the app at `/auth/register`.

### 6. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗄 Supabase Project Config

### Tables

| Table         | Purpose                                       |
| ------------- | --------------------------------------------- |
| `flights`     | Flight schedule, route, pricing               |
| `seats`       | Per-flight seat map with class & availability |
| `bookings`    | User bookings with PNR, status, price         |
| `passengers`  | Passenger details per booking                 |
| `reschedules` | Reschedule history with fee tracking          |

### RLS Policies

- **flights / seats**: Public read access (everyone can search)
- **bookings**: Users can only SELECT/INSERT/UPDATE their own bookings (`auth.uid() = user_id`)
- **passengers / reschedules**: Accessible only through their parent booking

### RPC Functions

- **`reserve_seat(...)`** — Locks the seat row using `FOR UPDATE NOWAIT` before booking to prevent race conditions. Atomically marks seat unavailable and creates booking + passenger records.
- **`cancel_booking(...)`** — Checks the 2-hour departure window, then atomically cancels booking and frees the seat.

### DB-Level Trigger

- **`enforce_cancellation_window`** — Fires on any `bookings` UPDATE that sets `status = 'cancelled'`. Raises an exception if departure is within 2 hours. This is enforced at the database level, independently of application logic.

### Enable Realtime

Go to **Supabase Dashboard → Database → Replication → Tables** and enable Realtime for the `seats` table.

---

## 🗃 Zustand Store Structure

### `useFlightStore` (persisted)

```js
{
  searchQuery: { origin, destination, date, passengerCount, class },
  selectedFlight: { ...flightObject },
  selectedSeat: { ...seatObject },
  currentStep: 1-5,
  passengerForm: { fullName, nationality, dob },  // passportNo excluded from persist!
  optimisticSeatId: UUID | null,
}
```

**Key design decisions:**

- `partialize` excludes `passportNo` from localStorage — sensitive passport data never hits disk
- `selectedFlight` and `searchQuery` are persisted so users can resume after closing the tab
- `optimisticSeatId` is set immediately on click (before Supabase write confirms) for instant UI feedback
- `resetBookingFlow()` is called on confirmation; `resetAll()` is called on logout

### `useUserStore` (persisted)

```js
{
  session: { access_token, refresh_token },  // only tokens persisted
  user: { ...userObject },   // not persisted
  cachedBookings: [...],     // not persisted (for offline reading)
}
```

**Key design decisions:**

- Only `access_token` and `refresh_token` are stored in localStorage — no full user object
- `cachedBookings` lives in memory (and Zustand state) so My Bookings page works offline using last-fetched data

---

## 🛣 Routes Overview

| Route            | Description                              |
| ---------------- | ---------------------------------------- |
| `/`              | Landing page with route cards            |
| `/search`        | Flight search form                       |
| `/results`       | Filtered flight listings                 |
| `/booking`       | Seat selection + passenger form + review |
| `/confirmation`  | Booking success with PNR                 |
| `/my-bookings`   | All user bookings with cancel/reschedule |
| `/reschedule`    | Alternative flight selection             |
| `/auth/login`    | Sign in                                  |
| `/auth/register` | Sign up                                  |
| `/offline`       | PWA offline fallback                     |

---

## ✈ Flight Routes & Seed Data

| Route                             | Flights      | Duration |
| --------------------------------- | ------------ | -------- |
| BOM (Mumbai) → DEL (Delhi)        | FM101, FM102 | 2h 10m   |
| DEL (Delhi) → BLR (Bangalore)     | FM201, FM202 | 2h 45m   |
| BLR (Bangalore) → HYD (Hyderabad) | FM301, FM302 | 1h 20m   |
| HYD (Hyderabad) → BOM (Mumbai)    | FM401, FM402 | 1h 40m   |

**Seat classes per flight:**

- First Class: Rows 1–2, Seats A–D (8 seats, +₹8,000)
- Business: Rows 3–6, Seats A–F (24 seats, +₹3,500)
- Economy: Rows 7–30, Seats A–F (144 seats, free)

---

## 🌐 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# NEXT_PUBLIC_APP_URL
```

Or connect your GitHub repo to Vercel for auto-deployments.

---

## 📱 PWA Features

- **Installable** via `manifest.json` with 192×192 and 512×512 icons
- **Offline fallback** page at `/offline`
- **My Bookings cached** — last-fetched bookings readable offline via Zustand state
- **Cache strategies:**
  - `StaleWhileRevalidate` — Supabase flight search results
  - `CacheFirst` — `/_next/static/` and image assets
- **Install banner** shown to first-time mobile visitors

---

## 🧪 Test Credentials

```
Email:    test@aeroflow.dev
Password: TestPass123!
```

---

## ⚠ Trade-offs & Notes

- **paymentss**: Razorpay integration is scaffolded (price shown at review step) but actual paymentss gateway is not wired — intentionally left out per scope.
- **Multi-passenger**: The current flow books 1 passenger per booking. Multi-passenger requires iterating `reserve_seat` RPC per passenger.
- **Email confirmation**: Not implemented — would use Supabase Edge Functions + Resend/SendGrid.
- **Search by date**: Searches within the calendar day of `departs_at`. Cross-midnight flights may span two date-filtered queries.
