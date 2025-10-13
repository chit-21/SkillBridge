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
        - List _future features_ but do **not implement yet**:
            - gamification badges
            - AI recommendations
            - mobile app
            - real-time translation
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
