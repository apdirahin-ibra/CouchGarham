# Best Official App — Youth Football Club Management

A mobile-first, full-stack web application designed for Somali youth football club management, built with TanStack Start, React 19, TypeScript, Tailwind CSS, Drizzle ORM, and PostgreSQL.

---

## ⚽ Features & Architecture

### Dual User Roles
1. **Player Role (Ciyaartoy)**:
   - **Passwordless Authentication**: Quick login via active roster dropdown selection.
   - **10 Core Navigation Tabs**:
     1. *Xogtaada (Dashboard)*: Daily attendance status, coach voice announcement banner with interactive audio player, monthly personal statistics (goals, assists, errors), and leave balance.
     2. *Xaadiris (Attendance)*: Personal attendance history and excuse submission.
     3. *Jadwal (Schedule)*: Weekly training schedule, times, and venue locations.
     4. *Fasax (Leave)*: Monthly leave requests (concurrency-safe transactional cap of 3 days per month).
     5. *Fikrad (Suggestions)*: Direct suggestions and feedback to coaching staff.
     6. *Wadahadal (Chat)*: Team communication board with real database persistence, error indicators, and 5-second polling updates.
     7. *Sawiro (Gallery)*: Club photo gallery and memories.
     8. *Lacagta (Finance)*: Transparent club ledger (income, expenses, and treasury balance with integer-cents exact arithmetic).
     9. *Waano (Tips)*: Football and health advice.
     10. *Sharci (Rules)*: Official club code of conduct and guidelines.

2. **Admin Role (Maamule)**:
   - **Password Verification**: Secure `salt:hash` scrypt password verification with timing-safe comparison.
   - **11 Core Management Tabs**:
     1. *Xogtaada (Dashboard)*: Today's team attendance breakdown, live login activity, monthly team totals, and database-backed pending requests badge.
     2. *Ciyaartoy (Players)*: Full roster management (create, edit, deactivate, view player profile).
     3. *Xaadiris (Attendance)*: Date-based attendance marker (Xadir, Maqan, Daahay) with instant persistence.
     4. *Natiijo (Stats)*: Monthly goals, assists, errors, and attendance counts editor.
     5. *Codsi (Requests)*: Consolidated requests inbox (Excuses, Leaves, Join club applications) with transactional state checks before side effects.
     6. *Jadwal (Schedule)*: Weekly schedule editor and historical weekday attendance breakdown.
     7. *Wadahadal (Chat)*: Administrative and team broadcast chat.
     8. *Sawiro (Gallery)*: Gallery photo upload (device upload to Supabase Storage or URL) and object deletion.
     9. *Lacagta (Finance)*: Treasury ledger management with integer-cents exact arithmetic.
     10. *Waano (Tips)*: Create and edit football tips.
     11. *Sharci (Rules)*: Live dashboard banner, coach voice announcement recording with MediaRecorder and Supabase Storage upload, and club rules editor.

---

## 🎨 Somali Pitch-Dark Theme System

- **Pitch Background**: `#0D1711` / `#132018` (Deep stadium pitch)
- **Trophy Gold**: `#C9A24B` (Brand accent, active states, and highlights)
- **Chalk White**: `#F4EFE1` (High-contrast typography)
- **Card Red (Maqan / Kharash)**: `#B4432F`
- **Warning Amber (Daahay / Pending)**: `#C08A2E`

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 24.x or later
- PostgreSQL database (e.g. Supabase)

### 2. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```
Fill in your database connection string and secret keys in `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/best_official"
BETTER_AUTH_SECRET="your-32-character-random-hex-string"
BETTER_AUTH_URL="http://localhost:3000"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_APP_URL="http://localhost:3000"
ADMIN_INITIAL_USERNAME="admin"
ADMIN_INITIAL_PASSWORD="your-secure-password"
```

### 3. Database Migration & Seeding
```bash
# Push or check Drizzle schema migrations
npm run db:check

# Seed initial admin user and club roster (requires ADMIN_INITIAL_PASSWORD in env or ALLOW_DEMO_SEED=true)
npm run db:seed
```

### 4. Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 Testing & Code Quality

```bash
# Run Unit Tests (Vitest)
npm run test:unit

# Run Component Tests (Vitest + Testing Library)
npm run test:component

# Run End-to-End Tests (Playwright)
npm run test:e2e

# Run TypeScript Type-Check
npm run type-check

# Run Linter (ESLint)
npm run lint

# Format Code (Prettier)
npm run format
```

---

## 📦 Production Build

```bash
npm run build
npm run preview
```
Compiled server and client assets are generated to `.output/` ready for deployment on Node.js, Vercel, or Docker.
