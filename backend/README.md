# RExchange Backend API & Architecture

RExchange is a student resource-exchange platform designed for campus communities. It replaces monetary transactions with **Karma Points** — a non-transferable internal currency earned by giving and spent by receiving.

---

## 🏛️ System Architecture

- **Runtime**: Node.js + Express with Strict TypeScript (`ES2022`)
- **Validation**: Zod runtime schema validation on body, params, and queries
- **Data Isolation**: Clean Repository Layer (`src/data/repository.interface.ts`) decoupling database engines (Supabase Postgres / In-Memory Mock Store) from business logic
- **Security & Integrity**: College domain email verification (`@srmist.edu.in`), JWT access/refresh rotation, rate limiting, and mutual handoff confirmation.

---

## 📦 Module Breakdown & Viva/Judge Defense Catalog

### Module 1: Auth & College Verification
- **Endpoints**:
  - `POST /auth/signup`
  - `POST /auth/verify-otp`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `GET /users/me`
  - `PATCH /users/me`
- **Judge Defense Script**:
  > *"Unlike generic marketplaces where anyone can create anonymous throwaway accounts, RExchange strictly restricts signup to verified institutional email domains (e.g. `@srmist.edu.in`). This creates a closed high-trust intranet where every user is an identifiable campus peer tied to their physical hostel block and academic department."*

---

### Module 2: Unified Listings Module & Heuristic Karma Suggestion
- **Endpoints**:
  - `POST /listings`
  - `GET /listings`
  - `GET /listings/:id`
  - `PATCH /listings/:id`
  - `DELETE /listings/:id`
  - `GET /listings/search?q=&type=&category=&hostelBlock=`
  - `POST /listings/suggest-karma` (Pure function calculation)
- **Judge Defense Script**:
  > *"Standard classifieds treat every item as an arbitrary price tag with price gouging. RExchange unifies 5 distinct campus exchange types (Items, Study Notes, Tickets, Skills, and Hackathon Opportunities) and computes an algorithmic karma heuristic to suggest fair, anti-inflationary values while giving students flexibility within a safe bounded range."*

---

### Module 3: Urgent Need Board (USP #1)
- **Endpoints**:
  - `POST /needs`
  - `GET /needs?sort=urgency`
  - `POST /needs/:id/fulfill`
- **Judge Defense Script**:
  > *"Most marketplaces only support supply-driven feeds ('here is what I have'). RExchange introduces the Urgent Need Board for high-pressure demand situations — like needing a scientific calculator 2 hours before an Engineering exam. The server calculates a real-time urgency score that floats critical requests to the top of the feed and rewards rapid fulfillers with an emergency 1.25x karma multiplier bonus."*

---

### Module 4: AI Smart-Match Engine (USP #2)
- **Endpoints**:
  - `GET /match/suggestions`
  - `POST /match/feedback`
- **Judge Defense Script**:
  > *"Instead of forcing students to manually search through hundreds of listings, our Smart-Match Engine uses vector cosine similarity over user needs, academic department, and hostel proximity. It surfaces high-affinity listings directly in a 'Suggested for you' feed with transparent explanation tags and a feedback loop."*

---

### Module 5: Exchange & Mutual Handoff Escrow Flow
- **Endpoints**:
  - `POST /exchanges`
  - `PATCH /exchanges/:id/accept`
  - `PATCH /exchanges/:id/confirm-handoff`
  - `PATCH /exchanges/:id/cancel`
  - `PATCH /exchanges/:id/dispute`
  - `GET /exchanges`
  - `GET /exchanges/:id`
- **Judge Defense Script**:
  > *"Because no fiat currency is involved, traditional banking escrow is unnecessary. Instead, RExchange enforces a 4-stage mutual confirmation protocol (`REQUESTED` -> `ACCEPTED` -> `HANDOFF_CONFIRMED` -> `COMPLETED`). Karma only settles when both giver and receiver independently confirm physical or digital handoff, preventing fraud and ghosting."*

---

### Module 6: Chat & Structured Karma Negotiation
- **Endpoints**:
  - `GET /exchanges/:id/messages`
  - `POST /exchanges/:id/messages`
  - `PATCH /exchanges/:id/messages/:msgId/respond`
- **Judge Defense Script**:
  > *"Unlike disjointed messaging apps, each chat thread is bound strictly to an active exchange contract. In addition to standard text, students can send interactive 'propose karma' counter-offers that update the underlying transaction terms in real-time when accepted."*

---

### Module 7: Trust & Reputation Engine
- **Endpoints**:
  - `POST /exchanges/:id/rate`
  - `GET /users/:id/reputation`
- **Judge Defense Script**:
  > *"Our reputation engine combines 5-star ratings with contextual tag endorsements ('on time', 'clean notes') and an activity decay factor. It dynamically mints peer badges like 'Verified Giver' and 'Fast Responder' to highlight high-value campus contributors."*

---

### Module 8: Campus Impact Score (USP #3)
- **Endpoints**:
  - `GET /impact/me`
  - `GET /impact/campus`
- **Judge Defense Script**:
  > *"RExchange demonstrates measurable ESG and circular economy benefits. Every completed exchange computes tangible impact metrics: INR money saved by students, kilograms of potential e-waste/physical waste diverted from landfills, and peer tutoring hours exchanged across campus."*

---

### Module 9: Gamification & Inter-Block Leaderboards
- **Endpoints**:
  - `GET /leaderboard?scope=week|alltime&groupBy=department|hostel`
- **Judge Defense Script**:
  > *"We turn campus sharing into a healthy inter-hostel competition. By aggregating karma given across hostel blocks and academic departments, RExchange builds social proof and drives organic student engagement without financial incentives."*

---

### Module 10: In-App Notifications Feed
- **Endpoints**:
  - `GET /notifications`
  - `PATCH /notifications/:id/read`
  - `PATCH /notifications/read-all`
- **Judge Defense Script**:
  > *"Keeps students updated on match alerts, urgent need fulfillment, peer handoff confirmations, and karma milestone bonuses directly inside their institutional workspace."*

---

### Module 11: Admin Moderation & Background Jobs
- **Endpoints**:
  - `GET /admin/disputes`
  - `PATCH /admin/disputes/:id`
  - `GET /admin/flagged-listings`
  - `PATCH /admin/users/:id/ban`
- **Background Jobs**:
  - Automated listing expiry
  - Urgent need deadline expiry
  - 14-day inactivity nudges
- **Judge Defense Script**:
  > *"Provides campus leads and student council moderators with quick tools to resolve disputes, refund karma, and automatically keep the campus feed clean of stale or expired listings."*
