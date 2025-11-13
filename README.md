# SkillBridge

**Initial commit for the SkillBridge project.**

---

# SkillBridge — Detailed Implementation Roadmap

---

## PHASE 1 — Planning & Architecture _(2–3 days)_

**Purpose:**  
Lay the foundation — requirements, architecture, and scope.  
_Without this, later phases will either break or require expensive rewrites._

**Tasks & Details:**

- **Requirement Gathering**
    - **Do Now:**
        - Finalize MVP scope:
            - user registration
            - profile creation
            - skill posting
            - matching
            - basic chat/video
            - reviews
            saving the transcript of conversation for weighted score of relevance 
            of conversation wrt skill chosen and some som weighted ratio of feedback given by the learner 
            which greatly determines the credits to be transferred  
        
    - **Outcome:** Prevents scope creep during MVP.

- **System Architecture Design**
    - **Decisions:**
        - **Frontend:** Next.js (SEO-friendly, fast rendering) + TailwindCSS for styling.
        - **Backend:** Node.js + Express for APIs.
        - **Real-time:** Socket.io for chat + signaling.
        - **Video:** WebRTC (native API or PeerJS wrapper).
       
        - **Database:** firestore for backend and authentication, Redis for caching.
        - **Deployment:** Vercel for frontend, Railway/Render for backend
    - **Outcome:** All tech stack decisions locked.

- **Database Schema Design**
    - **Collections:**
        - `users`: profile info, timezone, skills
        - `skills`: skill tags & proficiency
        - `matches`: matched user IDs, match score, status
        - `sessions`: scheduled calls
        - `reviews`: rating, comments
        - `points`: earned/spent
    - **When to Do:** Right after architecture decisions.

- **API Documentation**
    - Define all endpoints now:
        - `/auth/register`, `/auth/login`
        - `/skills` (POST, GET)
        - `/match` (GET)
        - `/session/start` (POST)
        - `/reviews` (POST)
    - **Outcome:** Backend dev has a clear contract before coding.

---

## PHASE 2 — Core Backend Setup _(5–7 days)_

**Purpose:** Set up user management, skill posting, and matching API skeleton.

**Tasks & Details:**
- **Initialize Backend**
    - Create Node.js project with Express.
    - Setup folder structure (`routes`, `controllers`, `models`, `middlewares`).
    - Add `.env` config, error handling middleware.
    - **Dependencies:** express, dotenv, cors.
- **Authentication System**
    using firebase
    - Middleware for protected routes.
- **User Profile & Skill Management**
    - `/skills` POST → Add teaching/learning skills.
    - `/skills` GET → Retrieve skills by user or globally.
- **Matching Service Integration**
    - Python (Flask/FastAPI) microservice:
        - **Input:** List of users with teach/want skills.
        - **Output:** Pairs with match scores.
        - Uses NetworkX to model as bipartite graph and run maximum matching.
    - Node.js backend calls this service when:
        - New user joins.
        - Skill list changes.
        - Daily batch job (via cron).
    - **Dependencies:** requests (Node), flask/fastapi (Python), networkx.
- **Database Setup**
    - Firestore
    - Index skills and timezones for faster match search.
- **Testing**
    - Test APIs using Postman.

---

## PHASE 3 — Frontend MVP _(5–7 days)_

**Purpose:** Build the UI for skill posting, match viewing, and profile management.

**Tasks & Details:**
- **Initialize Next.js**
    - Install TailwindCSS for UI.
    - Setup global styles, layout, and navbar.
- **Pages & Components**
    - `/login`, `/register` (Forms)
    - `/dashboard` (match list)
    - `/profile` (skills management)
    - Reusable UI components (Button, Input, Card).
- **Profile Management**
    - Form to add skills (teach/learn).
    - API integration with `/skills`.
- **Match Results Page**
    - Fetch matches from `/match`.
    - Display match score, skill overlap, actions (accept/reject).
- **Responsive Design**
    - Mobile-first layouts.

---

## PHASE 4 — Real-Time Communication _(5–8 days)_

**Purpose:** Enable chat, calls, and scheduling.

**Tasks & Details:**
- **Socket.io Setup**
    - Backend: `io.on('connection', ...)` with JWT auth.
    - Frontend: Socket.io client connection.
    - Store messages in MongoDB.
- **WebRTC Integration**
    - Signaling via Socket.io.
    - PeerJS or vanilla WebRTC for P2P media.
    - Features: video call, screen share, whiteboard (fabric.js).
- **Session Scheduling**
    - React Calendar for date/time selection.
    - Backend stores in `sessions` collection.
    - Notify both users.
- **Push Notifications**
    - Firebase Cloud Messaging for reminders.

---

## PHASE 5 — Points & Reviews _(3–5 days)_

**Purpose:** Reward system for engagement.

**Tasks & Details:**
- **Points System**
    - Earn points when teaching.
    - Spend points when learning.
    - Auto-deduct on session creation.
- **Reviews**
    - After each session, POST review.
    - Display average rating in profile.
- **Leaderboards**
    - Query top teachers monthly.

---

## PHASE 6 — Testing & Optimization _(4–6 days)_

**Purpose:** Ensure stability, performance, and security.

**Tasks & Details:**
- **Unit Testing**
    - Jest for Node.js, Pytest for Python matching.
- **Integration Testing**
    - Test full flow: register → post skill → match → schedule → review.
- **Performance Optimization**
    - Redis cache for match results.
    - Lazy load video components.
- **Security**
    - Input sanitization.
    - Rate limiting.
    - HTTPS.

---

## PHASE 7 — Deployment _(2–3 days)_

**Purpose:** Go live.

**Tasks & Details:**
- **Frontend Deployment**
    - Vercel (auto-deploy from GitHub).
- **Backend Deployment**
    - Railway/Render (Docker container or Node build).
- **Database Hosting**
    - MongoDB Atlas.
- **Domain & SSL**
    - Buy domain, setup Cloudflare.

---

## PHASE 8 — Post-Launch Improvements _(Ongoing)_

**Purpose:** Enhance product.

**Future Features:**
- AI-based match recommendations
- React Native mobile app
- Group learning
- Real-time language translation




Frontend (Next.js)

Framework: Next.js (React-based)

Styling: TailwindCSS

Auth: Uses Firebase Client SDK

Communication: Calls backend REST APIs (and optionally WebSocket endpoints)

Deployment: Vercel

Role: Handles UI — registration, profile, skills, matches, chat/video UI, reviews, etc.

Backend (Node.js + Express)

Framework: Express

Auth: Uses Firebase Admin SDK to verify tokens from frontend

Database: Firestore

Real-time: Socket.io (for chat signaling)

ML/Matching: Python microservice (FastAPI/Flask) for graph-based user matching

Caching: Redis

Deployment: Railway/Render

Role: Provides APIs for users, skills, matches, sessions, reviews, etc.





# SkillBridge — Backend: MVP Controllers, Routes, Folder Structure & Scaffolding Commands

> This document contains a recommended folder structure, a complete list of MVP controllers and routes, models/collections, middleware & services, and the shell commands to scaffold the project (Node.js/Express backend + Python matching microservice).

---

## Project overview (MVP features)

* User registration & auth
* Profile creation
* Skill posting (teach / learn tags + proficiency)
* Matching (pairing teacher & learner, match score)
* Scheduling sessions (chat / video)
* Basic chat & signaling for WebRTC
* Reviews & ratings
* Points/credits system
* Save conversation transcript & compute weighted relevance score
* Notifications (email / push)

---

## Top-level folder structure

skillbridge/
│
├── .env.local                     # Frontend + server route environment variables
├── .gitignore
├── package.json                   # Root package manager config (workspaces if needed)
├── README.md
│
├── next.config.js                 # Next.js configuration
├── tailwind.config.js
├── tsconfig.json
│
└── src/
    ├── app/                       # ⚛️ Next.js App Router (pages + server routes)
    │   ├── layout.tsx             # Root layout (header, footer, theme)
    │   ├── page.tsx               # Landing page
    │
    │   ├── login/
    │   │   └── page.tsx           # Login page
    │
    │   ├── register/
    │   │   └── page.tsx           # Registration page
    │
    │   ├── dashboard/
    │   │   └── page.tsx           # Matched users + sessions overview
    │
    │   ├── profile/
    │   │   └── page.tsx           # Manage skills + user profile
    │
    │   ├── match/
    │   │   └── page.tsx           # View matched results
    │
    │   ├── sessions/
    │   │   └── page.tsx           # Scheduled learning sessions
    │
    │   ├── reviews/
    │   │   └── page.tsx           # User reviews
    │
    │   ├── api/                   # ✅ Server-side routes (built-in Next.js API)
    │   │   ├── auth/              # Authentication routes
    │   │   │   ├── register/route.ts  # Registers a new user
    │   │   │   └── login/route.ts     # Logs in a user
    │   │   │
    │   │   ├── skills/route.ts    # CRUD operations for skills
    │   │   ├── match/route.ts     # Fetch matched users or recommendations
    │   │   ├── sessions/route.ts  # Schedule, update, fetch sessions
    │   │   └── reviews/route.ts   # Submit and fetch reviews
    │
    ├── components/                 # 🧩 Reusable UI components
    │   ├── Navbar.tsx
    │   ├── Button.tsx
    │   ├── InputField.tsx
    │   ├── SkillCard.tsx
    │   └── MatchList.tsx
    │
    ├── contexts/                   # 🧠 React Context API (global state)
    │   ├── AuthContext.tsx
    │   ├── SocketContext.tsx
    │   └── ThemeContext.tsx
    │
    ├── lib/                        # 🔧 Frontend + server helper logic
    │   ├── firebase.ts             # Firebase client SDK setup
    │   ├── apiClient.ts            # Fetch/axios instance for frontend calls
    │   ├── authService.ts          # Login/register logic
    │   └── utils.ts                # Generic helper functions
    │
    ├── services/                   # 🔍 Shared business logic (used by API routes)
    │   ├── matchService.ts         # Matchmaking logic (ML calls or algorithm)
    │   ├── notificationService.ts  # Push/email notifications
    │   └── pointsService.ts        # Gamification logic
    │
    ├── sockets/                    # 💬 Real-time handlers
    │   └── chatSocket.ts           # WebSocket logic for chat
    │
    ├── ml-service/                 # 🤖 Optional Python microservice
    │   ├── app.py
    │   ├── requirements.txt
    │   └── services/
    │       └── match_engine.py     # Graph-based matching logic
    │
    └── scripts/                    # ⚙️ Utility scripts
        ├── seedData.ts             # Populate DB with fake data
        ├── cronJobs.ts             # Scheduled tasks (e.g., match refresh)
        └── deploy.sh               # Automated deployment

---

## Collections (Firestore) / Models summary

MVP Firestore Collections / Models
Collection	Fields	Notes
users	{ uid, name, email, timezone, profile, teachingSkills: [{skill, level}], learningSkills: [{skill, level}], points }	Core user profile and skills
skills	{ skillId, name, category }	Simple skill catalog
matches	{ matchId, userA, userB, score, status, createdAt }	User-to-user match results
sessions	{ sessionId, matchId, scheduledAt, status, roomId }	Learning sessions
reviews	{ reviewId, sessionId, fromUser, toUser, rating, comments }	Session reviews
points	{ userId, balance }	Points for gamification (simplified)

##MVP Controllers / Responsibilities

Controller	Purpose
auth.controller.ts	Register, login, logout (Firebase auth)
user.controller.ts	Get/update profile, add/remove skills
skill.controller.ts	CRUD for skills (create/search/list)
match.controller.ts	Trigger matchmaking, get matches, accept/reject match
session.controller.ts	Schedule session, start/end session
review.controller.ts	Post review, get user reviews
points.controller.ts	Get balance, update points

Note: No transcript scoring or external ML service yet — keep it simple for MVP.

MVP API Routes (Next.js style)
/api/auth/register      POST  # { name, email, password, timezone }
/api/auth/login         POST  # { email, password }
/api/auth/logout        POST

/api/users/me           GET   # protected: get profile
/api/users/me           PUT   # update profile
/api/users/me/skills    POST  # add skill
/api/users/me/skills/:skillId DELETE # remove skill

/api/skills             GET   # list/search skills
/api/skills             POST  # create skill
/api/skills/:skillId    GET   # get skill

/api/match/trigger      POST  # trigger matching
/api/match/:userId      GET   # get matches
/api/match/:matchId/accept POST
/api/match/:matchId/reject POST

/api/sessions/          POST  # schedule/start session
/api/sessions/:id       GET   # session details
/api/sessions/:id/complete POST # end session

/api/reviews/           POST  # post review
/api/reviews/user/:userId GET # get user reviews

/api/points/me          GET   # get points balance

MVP Middleware
Middleware	Purpose
auth.middleware.ts	Verify Firebase token, attach req.user
error.middleware.ts	Catch and format errors

Optional: validate.middleware.ts if you want simple request validation (Joi or Zod).



Simplified MVP Flow

User signs up / logs in → auth.controller → authService → Firebase + Firestore users.

User adds skills → user.controller → userService → update teachingSkills / learningSkills.

Trigger matchmaking → match.controller → matchService → compute simple score, save matches.

Schedule session → session.controller → sessionService → create session record.

Post review → review.controller → reviewService → save review.

Update/get points → points.controller → pointsService.

## Middleware (recommended)

* `auth.middleware.js` — verify Firebase token and set req.user
* `validate.middleware.js` — request body validation (Joi or express-validator)
* `error.middleware.js` — centralized error handler
* `rateLimiter.middleware.js` — basic request rate limiting (express-rate-limit)

---

## Services & Responsibilities

* **firebase.service.js** — wrap firebase-admin operations (getUser, createUserRecord, read/write collections)
* **matchClient.service.js** — HTTP client to the Python matching microservice; provides `computeMatchesForUser(userId)`
* **transcript.service.js** — save transcript, call NLP processor (if any) to compute relevance
* **points.service.js** — credit/debit logic and transaction history
* **notification.service.js** — send email / push via FCM
* **webrtc.service.js** — helper to generate/join rooms, token handling (if using SFU/turn servers)

---

## Transcript scoring (high-level)

* Save the session transcript to `transcripts` collection.
* Run `transcriptProcessor.js` job (on `jobs/`) which:

  1. Cleans text, extracts keywords.
  2. Compares keywords with session skill tags.
  3. Computes relevance score (e.g., keyword-match ratio × conversation-length factor).
  4. Combine relevance score with learner feedback (weighted ratio configurable in `constants.js`) to compute final points awarded.

---

## Python matching microservice (brief)

* `app.py` (Flask or FastAPI) exposes endpoints:

  * `POST /compute-match` — accepts list of user profiles & skills, returns pairings and scores
  * `GET  /status`
* Implementation uses `networkx` to construct a bipartite graph and run maximum weight matching.

---

## Recommended npm packages (server)

* runtime: `express`, `firebase-admin`, `cors`, `dotenv`, `axios`, `socket.io`, `ioredis` or `redis`, `bull` (for jobs/queues), `express-rate-limit`, `helmet`, `winston` (logging)
* development: `nodemon`, `eslint`, `prettier`

## Python match-service packages

* `flask` or `fastapi`, `uvicorn` (if FastAPI), `networkx`, `pydantic` (if FastAPI), `requests`

---

--------------------------------------------------------------------------------------




What You’ve Completed So Far
🧩 Core Setup

✅ Monorepo structure (/app for Next.js frontend + /backend or service layer)

✅ Firebase Admin SDK configured (adminAuth, adminDb)

✅ Environment variables set up for Firebase credentials

✅ Auth middleware (requireAuthOrRespond) for protected endpoints

👤 Auth Service

✅ Register/Login (with Admin SDK)

✅ Middleware verifies tokens for secure routes

✅ users collection managed with name, email, timezone, profile info

⚙️ Skill/Match System

✅ skillsService.ts with CRUD (done)

✅ matchService.ts integrated with Python microservice (done)

💬 Session + Review + Points

✅ sessionService.ts — schedule & complete sessions

✅ reviewService.ts — post and fetch reviews

✅ pointsService.ts — manage credits/debits

✅ API routes for sessions, reviews, and points (done above)

So at this point, your backend feature layer is complete (core version).





Next Phase — Phase C: Frontend Integration (Dashboard + UI Flow)

Here’s the recommended order:

1️⃣ User Dashboard (Frontend)

Create a dashboard page /dashboard that shows:

User’s points balance (GET /api/points/me)

User’s upcoming sessions (GET /api/sessions)

Recent reviews (GET /api/reviews/user/:id)

Option to trigger match (POST /api/match or /api/match/trigger)

👉 This page becomes the main home after login.

2️⃣ Matchmaking Flow (UI)

Page: /match

Button: “Find Matches”
→ Calls your triggerMatch() endpoint
→ Displays the returned list of potential matches with scores
→ Allow “Schedule Session” button beside each match

Clicking it opens a date-time picker → calls /api/sessions POST

3️⃣ Session Management UI

Page: /sessions

Tabs: Upcoming, Completed

For each upcoming session:

Show roomId

“Join Session” (link or mock video call room)

For completed sessions:

Button: “Leave a Review”

Clicking opens a modal → POST /api/reviews

4️⃣ Reviews UI

Page: /reviews

Show reviews received + average rating (computed client-side)

5️⃣ Points / Gamification 

Display point balance at top (navbar or dashboard widget)

Add rules like:
points given according to  weighted formula of review plus transcript score ---
Redeem or milestone badges later

🗂 Folder Structure Suggestion (Frontend)
src/
  app/
    dashboard/
      page.tsx          → main user dashboard
    match/
      page.tsx          → find matches
    sessions/
      page.tsx          → list sessions
    reviews/
      page.tsx          → list + add reviews
    api/
      ...               → (already done)
  components/
    DashboardCard.tsx
    MatchCard.tsx
    SessionCard.tsx
    ReviewCard.tsx
    PointsWidget.tsx

🧠 Phase D -

Once frontend integration is stable:

Feature	Description	Related Services
🎥 Video Call Integration	Use WebRTC / Daily.co / Agora for real-time sessions	Sessions
🧾 Transcript Upload	Upload transcript file → store ref in Firestore	Sessions
🪄 AI Review Summaries	Summarize reviews using OpenAI API	Reviews
📈 Analytics Page	Admin dashboard for monitoring sessions, matches, ratings	All
📢 Notifications	Use Firebase Cloud Messaging (already possible)	Points/Sessions