# ✈ AeroFlow — Flight Management PWA

<div align="center">

![AeroFlow Banner](https://img.shields.io/badge/AeroFlow-Flight%20Management-38a3d4?style=for-the-badge&logo=airplane&logoColor=white)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-State-orange?style=flat-square)](https://zustand-demo.pmnd.rs/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)

A production-grade, fully responsive **Flight Management Web App** where passengers can search flights, select seats interactively, book with Razorpay paymentss, reschedule, and cancel — with real-time seat updates powered by Supabase Realtime.

**🔗 Live Demo:** `https://your-app.vercel.app` ← _(replace with your Vercel URL)_

</div>

---

## 📸 Screenshots

> _(Add screenshots of your app here after deployment)_

---

## ✅ Submission Checklist

- [x] Public GitHub repository with descriptive commit history
- [x] `.env.example` with all environment variables listed
- [x] Supabase migration SQL files in `/supabase/migrations`
- [x] Seed script with 16 flights, full seat maps, and test user credentials
- [x] README with local setup, Supabase config, and Zustand store explanation
- [x] Deployed on Vercel — production URL above
- [ ] Lighthouse PWA screenshot _(add after deployment)_

---

## 🚀 Tech Stack

| Layer              | Technology                                   |
| ------------------ | -------------------------------------------- |
| Frontend & Routing | Next.js 14 (App Router)                      |
| Database & Auth    | Supabase (PostgreSQL + Auth + Realtime)      |
| State Management   | Zustand with persist middleware              |
| Styling            | Tailwind CSS + custom CSS variables          |
| paymentss          | Razorpay (Test Mode)                         |
| PWA                | next-pwa (StaleWhileRevalidate + CacheFirst) |
| Animations         | Framer Motion + CSS keyframes                |
| Deployment         | Vercel                                       |

---

## ⚡ Local Setup

### Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/aeroflow.git
cd aeroflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Run database migrations

Go to your **Supabase Dashboard → SQL Editor** and run these files **in order**:

**Step 1 — Schema** (`supabase/migrations/001_schema.sql`)

- Creates all 5 tables: `flights`, `seats`, `bookings`, `passengers`, `reschedules`
- Enables Row Level Security (RLS) on all tables with proper policies
- Creates `reserve_seat` RPC (atomic seat locking to prevent race conditions)
- Creates `cancel_booking` RPC (atomic cancellation with seat release)
- Adds DB-level trigger to block cancellations within 2 hours of departure

**Step 2 — Seed** (`supabase/migrations/002_seed.sql`)

- Seeds 16 flights across 4 routes with time-only data (works for any date)
- Generates full seat maps per flight (176 seats: 8 first, 24 business, 144 economy)
- Pre-occupies some seats for realistic availability

### 5. Enable Supabase Realtime

In Supabase Dashboard → **Database → Replication → Tables**  
Toggle **Realtime ON** for the `seats` table.  
This powers the live seat map updates.

### 6. Create test user

In Supabase Dashboard → **Authentication → Users → Add user (manual)**:

```
Email:    test@aeroflow.dev
Password: TestPass123!
```

### 7. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 Test Credentials

| Field    | Value               |
| -------- | ------------------- |
| Email    | `test@aeroflow.dev` |
| Password | `TestPass123!`      |

**Razorpay Test Card:**
| Field | Value |
|---|---|
| Card Number | `4111 1111 1111 1111` |
| Expiry | Any future date |
| CVV | `123` |
| OTP | `1234` |

> If Razorpay keys are not configured, the app automatically falls back to **mock payments mode** — bookings are created directly without a payments gateway so you can test the full flow.

---

## 🗄 Supabase Project Configuration

### Database Schema

```
flights
├── id (UUID, PK)
├── flight_no (VARCHAR, UNIQUE)
├── origin (VARCHAR 3)
├── destination (VARCHAR 3)
├── departs_at (TIMESTAMPTZ) ← placeholder date, time used dynamically
├── arrives_at (TIMESTAMPTZ) ← placeholder date, time used dynamically
├── depart_time (TIME)       ← actual departure time e.g. "06:00"
├── arrive_time (TIME)       ← actual arrival time e.g. "08:10"
├── duration_minutes (INT)
├── aircraft_type (VARCHAR)
├── status (VARCHAR)
└── base_price (DECIMAL)

seats
├── id (UUID, PK)
├── flight_id (UUID, FK → flights)
├── seat_number (VARCHAR)    ← e.g. "7A", "1B"
├── class (economy/business/first)
├── is_available (BOOLEAN)
└── extra_fee (DECIMAL)

bookings
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── flight_id (UUID, FK → flights)
├── seat_id (UUID, FK → seats)
├── status (confirmed/rescheduled/cancelled)
├── booked_at (TIMESTAMPTZ)
├── total_price (DECIMAL)
└── pnr_code (VARCHAR, UNIQUE)

passengers
├── id (UUID, PK)
├── booking_id (UUID, FK → bookings)
├── full_name (VARCHAR)
├── passport_no (VARCHAR)
├── nationality (VARCHAR)
└── dob (DATE)

reschedules
├── id (UUID, PK)
├── booking_id (UUID, FK → bookings)
├── old_flight_id (UUID, FK → flights)
├── new_flight_id (UUID, FK → flights)
├── requested_at (TIMESTAMPTZ)
└── fee_charged (DECIMAL)
```

### Row Level Security Policies

| Table         | Policy                                                                          |
| ------------- | ------------------------------------------------------------------------------- |
| `flights`     | Public read — anyone can search flights                                         |
| `seats`       | Public read — anyone can view seat availability                                 |
| `bookings`    | Users can only SELECT / INSERT / UPDATE their own rows (`auth.uid() = user_id`) |
| `passengers`  | Accessible only via parent booking owned by the user                            |
| `reschedules` | Accessible only via parent booking owned by the user                            |

### RPC Functions

**`reserve_seat(p_flight_id, p_seat_id, p_user_id, p_total_price, p_pnr_code, p_passenger_name, p_passport_no, p_nationality, p_dob)`**

- Uses `SELECT ... FOR UPDATE NOWAIT` to lock the seat row
- If another transaction holds the lock → throws immediately (no double-booking)
- Atomically: marks seat unavailable + creates booking + creates passenger record
- Returns `{ success: true, booking_id }` or `{ success: false, error: "..." }`

**`cancel_booking(p_booking_id, p_user_id)`**

- Verifies booking belongs to the user
- Checks departure is more than 2 hours away
- Atomically: sets booking status to `cancelled` + sets seat `is_available = TRUE`
- Returns `{ success: true }` or `{ success: false, error: "..." }`

### DB-Level Trigger

```sql
enforce_cancellation_window
```

Fires `BEFORE UPDATE` on `bookings`. If `status` is being set to `cancelled` and `departs_at - NOW() < 2 hours`, raises an exception. This enforces the rule at the database level, independent of application logic.

### Dynamic Date System

Flights are stored with **time-only fields** (`depart_time`, `arrive_time`) and a placeholder date `2000-01-01` in `departs_at`. When a user searches for a date, the app combines that date with each flight's time fields client-side — so the same 16 flights appear fresh every day without re-seeding.

---

## 🗃 Zustand Store Structure

The app uses two Zustand stores, both with `persist` middleware and careful `partialize` config to control what gets saved to `localStorage`.

### `useFlightStore` — `store/flightStore.js`

Manages the entire booking flow state.

```js
{
  // Search form
  searchQuery: {
    origin: '',          // IATA code e.g. "BOM"
    destination: '',     // IATA code e.g. "DEL"
    date: '',            // "YYYY-MM-DD"
    passengerCount: 1,
    class: 'economy',    // "economy" | "business" | "first"
  },

  // Booking flow
  selectedFlight: null,       // full flight object from DB
  selectedSeat: null,         // full seat object from DB
  currentStep: 1,             // 1=search, 2=results, 3=seats, 4=passenger, 5=confirm
  optimisticSeatId: null,     // set immediately on click before DB write confirms

  // Passenger details (passport excluded from localStorage)
  passengerForm: {
    fullName: '',
    passportNo: '',      // ← NOT persisted (sensitive)
    nationality: '',
    dob: '',
  },

  // Actions
  setSearchQuery(query),
  setSelectedFlight(flight),
  setSelectedSeat(seat),
  setCurrentStep(step),
  setPassengerForm(data),
  resetBookingFlow(),    // called on confirmation
  resetAll(),            // called on logout
}
```

**Key design decisions:**

- `partialize` excludes `passportNo` — passport numbers never touch `localStorage`
- `optimisticSeatId` is set instantly on seat click for immediate visual feedback before Supabase confirms
- `merge` function in persist config ensures no field is ever `undefined` after hydration (prevents React uncontrolled input warnings)
- `searchQuery` and in-progress booking are persisted so users can resume after closing the browser tab

### `useUserStore` — `store/userStore.js`

Manages auth session and cached bookings.

```js
{
  session: null,           // Supabase session object
  user: null,              // Supabase user object
  cachedBookings: [],      // last-fetched bookings (for offline reading)

  setSession(session),
  setUser(user),
  setCachedBookings(bookings),
  clearSession(),          // called on logout — clears everything
}
```

**Key design decisions:**

- `partialize` stores only `{ access_token, refresh_token }` — not the full session or user object
- `cachedBookings` is in-memory only — readable offline via Zustand state, never written to `localStorage`
- Auth state is also tracked via `useAuth` hook (`lib/useAuth.js`) which subscribes to `supabase.auth.onAuthStateChange` for real-time session updates

---

## ✈ Flight Routes & Seed Data

| Route                             | Flights                    | Duration | Base Price      |
| --------------------------------- | -------------------------- | -------- | --------------- |
| BOM (Mumbai) → DEL (Delhi)        | FM101, FM102, FM103, FM104 | 2h 10m   | ₹4,200 – ₹5,200 |
| DEL (Delhi) → BLR (Bangalore)     | FM201, FM202, FM203, FM204 | 2h 45m   | ₹5,500 – ₹6,400 |
| BLR (Bangalore) → HYD (Hyderabad) | FM301, FM302, FM303, FM304 | 1h 20m   | ₹2,600 – ₹3,300 |
| HYD (Hyderabad) → BOM (Mumbai)    | FM401, FM402, FM403, FM404 | 1h 40m   | ₹3,400 – ₹4,100 |

**Seat classes per flight (176 seats total):**
| Class | Rows | Columns | Seats | Extra Fee |
|---|---|---|---|---|
| First | 1–2 | A–D | 8 | +₹8,000 |
| Business | 3–6 | A–F | 24 | +₹3,500 |
| Economy | 7–30 | A–F | 144 | Free |

---

## 🛣 Application Routes

| Route            | Description                                | Auth Required       |
| ---------------- | ------------------------------------------ | ------------------- |
| `/`              | Landing page with route cards              | No                  |
| `/search`        | Flight search form                         | No                  |
| `/results`       | Filtered flight listings                   | No                  |
| `/booking`       | Seat selection + passenger form + payments | Yes (inline prompt) |
| `/confirmation`  | Booking success with PNR code              | Yes                 |
| `/my-bookings`   | All user bookings with cancel/reschedule   | Yes (inline prompt) |
| `/reschedule`    | Alternative flight selection               | Yes                 |
| `/auth/login`    | Sign in page                               | No                  |
| `/auth/register` | Sign up page                               | No                  |
| `/offline`       | PWA offline fallback                       | No                  |

> Auth-required pages show an **inline sign-in form** instead of redirecting — users never lose their booking progress.

---

## 📱 PWA Features

| Feature              | Details                                                             |
| -------------------- | ------------------------------------------------------------------- |
| Installable          | `manifest.json` with 192×192 and 512×512 icons                      |
| Offline fallback     | `/offline` page shown when no connectivity                          |
| Cached bookings      | My Bookings readable offline via last-fetched Zustand state         |
| Cache: flight search | `StaleWhileRevalidate` — fresh results when online, cached when not |
| Cache: static assets | `CacheFirst` — `/_next/static/` and images                          |
| Install banner       | Shown to first-time mobile visitors via `beforeinstallprompt`       |

---

## 🚀 Deploy to Vercel

### Option 1 — GitHub Integration (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add all environment variables from `.env.example`
4. Click **Deploy**

### Option 2 — Vercel CLI

```bash
npm i -g vercel
vercel
```

### Environment Variables for Vercel

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL          ← set to your Vercel URL
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```

---

## 📁 Project Structure

```
aeroflow/
├── app/
│   ├── api/payments/create-order/route.js   # Razorpay order creation
│   ├── auth/login/page.js
│   ├── auth/register/page.js
│   ├── booking/page.js                     # Seat selection + payments
│   ├── confirmation/page.js
│   ├── my-bookings/page.js
│   ├── reschedule/page.js
│   ├── results/page.js
│   ├── search/page.js
│   ├── offline/page.js
│   ├── layout.js
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── Navbar.js
│   │   └── AuthProvider.js
│   ├── seat-map/
│   │   └── SeatMap.js                      # Realtime seat grid
│   └── ui/
│       └── PWAInstallBanner.js
├── lib/
│   ├── supabase/
│   │   ├── client.js                       # Browser Supabase client
│   │   ├── server.js                       # Server Supabase client
│   │   └── middleware.js                   # Session refresh
│   └── useAuth.js                          # Auth hook
├── store/
│   ├── flightStore.js                      # Booking flow state
│   └── userStore.js                        # Auth + session state
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql                  # Tables, RLS, RPCs, trigger
│       └── 002_seed.sql                    # 16 flights + seat maps
├── public/
│   ├── manifest.json                       # PWA manifest
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── .env.example
├── .env.local                              # Your local secrets (gitignored)
├── next.config.js
├── tailwind.config.js
└── middleware.js
```

---

## ⚠️ Known Trade-offs & Notes

| Area                       | Note                                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Date storage**           | Flights store time-only; dates are injected client-side at search time. A production app would store each flight as a separate scheduled instance with a real date. |
| **Multi-passenger**        | Current flow books 1 passenger per booking. Multi-passenger would require iterating `reserve_seat` RPC per passenger in a transaction.                              |
| **payments verification**  | Razorpay `handler` fires client-side after payments success. Production apps should verify the payments signature server-side before creating the booking.          |
| **Email confirmation**     | Not implemented. Would use Supabase Edge Functions + Resend/SendGrid triggered after `reserve_seat`.                                                                |
| **Travel date on booking** | The `bookings` table doesn't store `travel_date` explicitly (uses `booked_at` as reference). A production schema would add `travel_date DATE` to bookings.          |

---

## 👤 Author

**Nishanth**  
CSE (AI & ML) — Gitam University, Hyderabad  
GitHub: [@your-username](https://github.com/your-username)

---

<div align="center">
  Built with ❤️ using Next.js + Supabase
</div>
