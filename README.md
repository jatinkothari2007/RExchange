<div align="center">

# ⚡ RExchange
### *The Campus Resource Economy — No Cash, Only Karma*

**A peer-to-peer resource sharing platform built for college students.**  
Trade notes, items, skills & event passes using a karma-based economy — not money.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-SRM_Campus-amber?style=for-the-badge)](https://github.com/jatinkothari2007/RExchange)
[![Backend](https://img.shields.io/badge/Backend-Node.js_+_Express-339933?style=for-the-badge&logo=node.js)](https://github.com/jatinkothari2007/RExchange/tree/main/backend)
[![Frontend](https://img.shields.io/badge/Frontend-React_+_Vite-61DAFB?style=for-the-badge&logo=react)](https://github.com/jatinkothari2007/RExchange/tree/main/frontend)
[![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/Tests-18%2F18_Passing-success?style=for-the-badge&logo=checkmarx)](https://github.com/jatinkothari2007/RExchange)

---

> 🏆 Built for **Smart India Hackathon (SIH) 2026** — SRMIST Campus Track  
> *"Why buy when a senior already has it? Why waste when a junior needs it?"*

</div>

---

## 🌟 What is RExchange?

RExchange is a **Karma-based peer resource exchange ecosystem** exclusively for college students. Instead of spending real money, students earn and spend **Karma Points** by sharing what they have and receiving what they need.

```
Student A has: Casio Calculator (unused)     →  Posts listing for 25 Karma
Student B needs: Calculator for exams        →  Requests exchange
Student A gives → Student B receives         →  QR Handoff scan completes deal
Student A earns 25 Karma, Student B spends 25 Karma ✅
```

No cash. No payment gateways. Just a thriving campus economy built on trust.

---

## ✨ Core Features

### 🎓 Feature 1 — Karma Will & Senior Legacy
> *"Graduating? Leave your Karma and resources to a junior."*

Seniors nominate a junior heir before graduating. With one click, all their Karma balance and active listings are atomically transferred — creating a sustainable campus economy that **compounds across batches**.

### 📦 Feature 2 — Bundle Trades
> *"Take my breadboard AND my DSP notes together for less."*

Sellers can group multiple items/notes into a single bundled offering with a combined karma price — incentivizing bulk resource handoffs and helping juniors get everything they need at once.

### 🎤 Feature 3 — Voice Pitch Notes for Skills
> *"Let your voice sell your skill better than text ever could."*

Skill listings (tutoring, mentoring, coding help) support a **20-second audio pitch** recorded directly in-browser. Buyers can listen before requesting — adding a human touch to skill discovery.

### 🤖 Feature 4 — Algorithmic Karma Heuristics
> *"Never overprice or underprice your resource again."*

An intelligent pricing engine analyzes resource type, condition, original price, category, and usage patterns to compute a **fair Karma value** with bounded min/max caps — bringing market efficiency to campus sharing.

### 💸 Feature 5 — Emergency Karma Loans
> *"Need Karma now? Borrow up to 15 points, auto-repaid on your next give."*

Students with zero Karma balance can take an emergency micro-loan (up to 15 Karma) that auto-settles from earnings on their next completed give exchange — zero paperwork, instant disbursement.

### 🔭 Feature 6 — Cross-Department Spotlight
> *"A CSE senior's React skills are invisible to ECE students — until now."*

An AI-powered discovery engine surfaces high-value skills and resources **across department silos**, pairing interdisciplinary needs with relevant givers using vector similarity matching.

### 📱 Feature 7 — QR Handoff Verification
> *"Both parties confirm the handoff with a 6-digit QR code scan."*

Physical exchanges are verified via a unique `handoff_code` generated on acceptance. When the receiver scans it, Karma is instantly transferred, the exchange is marked complete, and any active emergency loan is automatically repaid.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RExchange Platform                       │
│                                                                 │
│  ┌──────────────┐    REST API    ┌──────────────────────────┐  │
│  │   React +    │ ◄──────────── │  Express.js + TypeScript │  │
│  │   Vite SPA   │               │       Backend API         │  │
│  │  (Port 3000) │ ──────────── ►│      (Port 4000)         │  │
│  └──────────────┘    /api proxy └────────────┬─────────────┘  │
│                                              │                  │
│                                    ┌─────────▼──────────┐      │
│                                    │  Supabase           │      │
│                                    │  PostgreSQL DB      │      │
│                                    │  + Realtime WS      │      │
│                                    │  + Storage          │      │
│                                    └────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, React Router v6 |
| **Backend** | Node.js, Express.js, TypeScript, Zod, JWT |
| **Database** | Supabase (PostgreSQL), Row Level Security, Realtime Subscriptions |
| **Auth** | Institutional email OTP (`@srmist.edu.in` restricted), JWT access + refresh tokens |
| **AI/Match** | Mock vector similarity engine (cosine matching on listing features) |
| **Storage** | Supabase Storage for avatars + voice note files |

---

## 🗂️ Project Structure

```
RExchange/
├── 📁 backend/                    # Express.js API Server
│   ├── src/
│   │   ├── modules/               # Feature modules (auth, listings, exchanges...)
│   │   │   ├── auth/              # OTP auth, JWT, Karma Will
│   │   │   ├── listings/          # CRUD, karma heuristics, voice notes
│   │   │   ├── exchanges/         # Exchange lifecycle, QR handoff
│   │   │   ├── bundles/           # Multi-item bundle trades
│   │   │   ├── loans/             # Emergency Karma loans
│   │   │   ├── match/             # AI cross-department matching
│   │   │   ├── spotlight/         # Cross-dept skill discovery
│   │   │   ├── needs/             # Urgent needs board
│   │   │   ├── gamification/      # Leaderboard, streaks
│   │   │   └── notifications/     # Real-time notifications
│   │   ├── data/
│   │   │   ├── repository.ts      # Repository pattern (in-mem + Supabase)
│   │   │   ├── store.ts           # In-memory data store
│   │   │   └── supabaseClient.ts  # Supabase connection
│   │   ├── middleware/            # Auth, validation, rate limiting, error handler
│   │   └── scripts/
│   │       └── testApi.ts         # Integration test suite (18/18 passing)
│   ├── .env.example               # Environment config template
│   └── tsconfig.json
│
├── 📁 frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── pages/                 # LoginPage, FeedPage, CreateListingPage...
│   │   ├── components/            # Navbar, Modals, Cards, VoiceNote components
│   │   ├── context/               # AuthContext, KarmaAnimationContext
│   │   ├── services/api.ts        # Typed API client
│   │   └── types.ts               # Shared TypeScript types
│   └── vite.config.ts
│
└── 📁 supabase/                   # Database Layer
    ├── combined_migration.sql     # Full schema + RLS + seed data (one file)
    └── migrations/                # Split migration files
        ├── 01_schema.sql          # Table definitions
        ├── 02_auth_triggers.sql   # Auth automation
        ├── 03_rls_policies.sql    # Row Level Security
        ├── 04_functions_triggers.sql
        ├── 05_storage.sql
        ├── 06_realtime.sql
        └── 07_seed_data.sql       # Demo users + listings
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A [Supabase](https://supabase.com) project (free tier works)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/jatinkothari2007/RExchange.git
cd RExchange
```

### 2. Set up the database
1. Open your Supabase project's **SQL Editor**
2. Paste and run the contents of `supabase/combined_migration.sql`
3. This creates all tables, RLS policies, realtime subscriptions, and seeds 15 demo users + listings

### 3. Configure backend environment
```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Install dependencies & run backend
```bash
# In /backend
npm install
npm run dev
# ✅ API running at http://localhost:4000
```

### 5. Install dependencies & run frontend
```bash
# In /frontend
npm install
npm run dev
# ✅ App running at http://localhost:3000
```

### 6. Run integration tests
```bash
# In /backend
npm run test:api
# 🎯 18/18 tests passing across all 7 core features
```

---

## 🧪 Test Suite

The project ships with a full integration test suite at `backend/src/scripts/testApi.ts`:

```
🧪 API Test Server started on http://localhost:4099

--- 1. Auth & College Verification ---
  ✅ GET  /health returns 200 OK
  ✅ POST /auth/signup rejects non-college domain email (@gmail.com)
  ✅ POST /auth/signup accepts @srmist.edu.in email
  ✅ POST /auth/verify-otp generates JWT session and grants seed Karma
  ✅ GET  /users/me retrieves verified profile with 50 Karma welcome seed

--- 2. Listings & Karma Heuristics ---
  ✅ POST /listings/suggest-karma computes algorithmic heuristic
  ✅ POST /listings creates SKILL-type listing
  ✅ POST /listings/:id/voice-note attaches 20s voice snippet

--- 3. Feature 2: Bundle Trades ---
  ✅ POST /bundles groups 2+ listings into single bundle offering
  ✅ POST /bundles/:id/exchange creates exchange contract

--- 4. Feature 1: Karma Will ---
  ✅ GET  /users/juniors returns verified junior campus peers
  ✅ POST /users/me/will nominates junior heir
  ✅ POST /users/me/will/execute atomically transfers karma + listings

--- 5. Feature 5: Emergency Karma Loans ---
  ✅ POST /loans/request disburses emergency karma under cap
  ✅ GET  /loans/me fetches active user loan state

--- 6. Feature 6: Cross-Department Spotlight ---
  ✅ GET  /spotlight/cross-department returns diverse skill pairs

--- 7. Feature 7: QR-Based Handoff ---
  ✅ POST /exchanges initiates exchange contract
  ✅ PATCH /exchanges/:id/accept generates 6-char handoff_code
  ✅ POST /exchanges/:id/handoff-scan instantly settles via QR scan

📊 TEST SUITE SUMMARY: 18 Passed, 0 Failed ✅
```

---

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Student profiles, Karma balance, Will settings, streaks |
| `listings` | Resource posts (ITEM, NOTE, TICKET, SKILL, OPPORTUNITY) |
| `exchanges` | Exchange lifecycle from REQUEST → ACCEPTED → COMPLETED |
| `karma_transactions` | Full audit ledger of every Karma credit/debit |
| `needs` | Urgent need requests with deadline and max karma offered |
| `messages` | In-exchange chat with karma negotiation proposals |
| `ratings` | Post-exchange reputation ratings (1-5 + feedback tags) |
| `notifications` | Real-time campus notification feed |
| `impact_log` | Sustainability impact metrics |

---

## 🔐 Environment Variables

| Variable | Description |
|---------|------------|
| `PORT` | Backend server port (default: `4000`) |
| `NODE_ENV` | Environment (`development` / `production`) |
| `ALLOWED_COLLEGE_DOMAIN` | Restrict signups to institutional email (e.g. `@srmist.edu.in`) |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase publishable anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin operations) |
| `INITIAL_KARMA_BALANCE` | Karma airdrop on first signup (default: `50`) |

---

## 📱 Screenshots

| Page | Description |
|------|------------|
| **Landing** | Animated hero with 3D Karma token, campus impact stats |
| **Login** | Institutional OTP auth with 1-Click Demo Persona buttons |
| **Feed** | Resource listings with type filters, spotlight carousel, AI match |
| **Create Listing** | Multi-type form with AI karma suggestions and voice recorder |
| **Exchange Chat** | Real-time karma negotiation with QR handoff modal |
| **Profile** | Karma balance, streak, reputation score, Karma Will settings |
| **Leaderboard** | Department & hostel-wise karma champions |
| **Impact Dashboard** | Personal + campus sustainability metrics |

---

## 👥 Demo Personas (Quick Login)

| Persona | Email | Year | Department |
|---------|-------|------|-----------|
| **Aarav Sharma** | `aarav.sharma@srmist.edu.in` | 3rd Year | Computer Science |
| **Priya Nair** | `priya.nair@srmist.edu.in` | 3rd Year | Electronics & Comm |
| **Rohan Gupta** | `rohan.gupta@srmist.edu.in` | 4th Year | Biotechnology |

> In development mode, OTP codes are printed to the console (`debugOtp` field in response).

---

## 🔮 Roadmap

- [ ] Native mobile app (React Native)
- [ ] Supabase Auth integration (magic links)
- [ ] WhatsApp/email notification delivery
- [ ] Karma NFT certificates for top contributors
- [ ] Multi-institution support (other colleges)
- [ ] ML-powered demand forecasting for resources

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ at SRMIST for SIH 2026**

*"Every item shared is a purchase avoided. Every skill taught is knowledge multiplied."*

⭐ **Star this repo if RExchange would help your campus!** ⭐

</div>
