# BEST OFFICIAL APP — Production Rebuild Specification

**Project:** BEST OFFICIAL APP  
**Product:** Youth Football Club Management Application  
**Primary UI Language:** Somali  
**Target Deployment:** Vercel  
**Document Type:** Rebuild / Technical Architecture Specification  
**Status:** Approved direction for rebuild  
**Prepared:** 2026-08-29  

---

## 1. Core Rebuild Rule

The rebuild must **modernize the technical stack without changing the overall purpose, workflows, roles, or normal user experience of the existing BEST OFFICIAL APP**.

The existing 17-page **BEST OFFICIAL APP — Complete System Specification** is the functional source of truth.

The rebuild is **not** a redesign of the product.

### Preserve

- The same youth-football-club management purpose.
- The same two user roles: **Admin** and **Player**.
- The same Somali-first interface.
- The same feature set and tab concepts.
- The same attendance ownership model: **Admin marks attendance; Players cannot mark their own attendance**.
- The same player login experience: player selects their own name and enters without a password.
- The same Admin username/password login concept.
- The same leave, excuse, join-request, gallery, schedule, finance, rules, announcement, chat, statistics, suggestions, and Waano workflows.
- The same WhatsApp deep-link behavior.
- The same current business rules unless explicitly changed by the requirements owner.

### Change

- Replace client-only shared storage with a proper database.
- Replace client-only authorization with server-side authorization.
- Replace plaintext Admin credential storage with secure authentication.
- Replace Base64 media-in-database storage with object storage.
- Add robust persistence error handling.
- Add database migrations and typed schemas.
- Make the application safe and practical to deploy on Vercel.

---

# 2. Final Target Tech Stack

| Layer | Selected Technology | Purpose |
|---|---|---|
| Full-stack framework | **TanStack Start** | React full-stack framework, SSR, server functions, routing integration |
| UI framework | **React** | Existing product is already React-based |
| Language | **TypeScript** | Type safety across UI, server, auth, and database |
| Routing | **TanStack Router** | File-based/type-safe application routing |
| Server state | **TanStack Query where useful** | Caching, mutations, revalidation, async state |
| Styling | **Tailwind CSS** | Preserve current mobile-first visual system |
| Database platform | **Supabase** | Managed PostgreSQL database |
| ORM | **Drizzle ORM** | Typed relational schema, queries, and migrations |
| Authentication | **Better Auth** | Secure sessions and server-side authentication |
| Media storage | **Supabase Storage** | Gallery images and voice announcements |
| Hosting | **Vercel** | Production and preview deployment |
| Icons | **lucide-react** | Preserve the current icon approach |
| Validation | **Zod or equivalent typed validation** | Validate all server-side input |
| Testing | **Vitest + React Testing Library** | Unit/component tests |
| E2E testing | **Playwright** | Critical Admin and Player workflows |

---

# 3. Stack Compatibility Verification

The selected technologies are compatible with the planned architecture.

## 3.1 TanStack Start + Vercel

TanStack Start is a full-stack React framework powered by TanStack Router and supports server functions, SSR, client/server builds, and deployment through Nitro-compatible hosting. Current official TanStack documentation includes Vercel as a supported deployment target.

**Important current status:** TanStack Start is currently documented as being in the **Release Candidate** stage. Its API is described by TanStack as feature-complete and considered stable, but the framework has not yet been presented in the official documentation as a final v1 stable release.

### Rebuild policy

- Use the current recommended TanStack Start setup at implementation time.
- Do not depend on undocumented internal APIs.
- Keep framework-specific logic isolated where practical.
- Use Vite unless a concrete implementation reason favors Rsbuild.
- Verify the Vercel/Nitro deployment instructions again immediately before production deployment.

---

## 3.2 Supabase + Drizzle ORM

Supabase provides a full PostgreSQL database and Drizzle officially documents Supabase/PostgreSQL integration.

### Connection policy for Vercel

Use Supabase's **connection pooler** for application/serverless database traffic.

Recommended application configuration:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
});

export const db = drizzle({ client });
```

`prepare: false` is important when using Supabase Transaction Pool mode because prepared statements are not supported in that mode.

### Database migrations

Use Drizzle Kit and committed SQL migrations.

```text
src/db/schema/
drizzle/
drizzle.config.ts
```

Production schema changes must be migration-driven rather than manually editing production tables.

---

## 3.3 Better Auth + Drizzle + Supabase

Better Auth supports a Drizzle adapter with PostgreSQL.

Conceptually:

```ts
betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
});
```

Better Auth should own its authentication/session tables while application data remains in the BEST OFFICIAL APP domain tables.

### Version policy

Use the latest **stable** Better Auth version at implementation time. Do not adopt a beta Better Auth release merely because a beta documentation page exists.

---

## 3.4 Supabase Storage

Supabase Storage is appropriate for:

- Gallery photographs.
- Voice announcement recordings.
- Future profile images if explicitly requested later.

Files should live in Storage buckets and the relational database should store metadata and object paths/URLs.

Do **not** store large Base64 image/audio strings inside ordinary database rows.

---

# 4. High-Level Production Architecture

```text
                         ┌──────────────────────────────┐
                         │          VERCEL              │
                         │                              │
User Browser ───────────►│   TanStack Start + React     │
                         │   TypeScript + Tailwind       │
                         │                              │
                         │   Server Functions / API      │
                         │   Better Auth                 │
                         │   Authorization               │
                         └──────────────┬───────────────┘
                                        │
                         ┌──────────────┴───────────────┐
                         │                              │
                         ▼                              ▼
               ┌──────────────────┐          ┌──────────────────┐
               │ Supabase         │          │ Supabase Storage │
               │ PostgreSQL       │          │                  │
               │                  │          │ Gallery Images   │
               │ Drizzle ORM      │          │ Voice Audio      │
               └──────────────────┘          └──────────────────┘
```

The browser must no longer have unrestricted direct access to all club data.

Sensitive writes must pass through authenticated and authorized server code.

---

# 5. Roles and Authentication

## 5.1 Admin

Current behavior to preserve:

- One Admin/coaching login concept.
- Username + password form.
- Full management access.

Production implementation:

- Better Auth handles Admin authentication.
- Password is hashed securely by the authentication system.
- Session is stored in a secure cookie.
- No plaintext Admin password is stored in a club-data record.
- All Admin-only server functions verify the Admin role.

### Initial Admin

The existing application historically uses one shared Admin identity. The rebuild should retain the **single-Admin product behavior** unless the owner explicitly requests multiple Admin accounts.

---

## 5.2 Player

Current behavior to preserve:

- Player selects their name from the roster.
- Player taps login.
- No password/PIN is required.
- Player enters their own role-specific interface.

This is an explicit product requirement and must **not** be silently changed into password login.

### Production implementation strategy

Use a server-side session implementation integrated with Better Auth.

Recommended design:

1. Each active Player has a corresponding auth/session identity or server-recognized player identity.
2. A custom Better Auth plugin or server-side compatibility endpoint receives the selected `playerId`.
3. The server verifies that the player exists and is active.
4. The server establishes a secure session bound to:
   - `role = "player"`
   - `playerId = selected player ID`
5. All Player queries use the authenticated session's `playerId`, never a player ID supplied freely by the browser.

This preserves the current **no-password player experience** while preventing a logged-in Player session from simply changing request parameters to retrieve another player's private records.

### Known security limitation retained by product choice

Because players authenticate by selecting a name rather than proving identity, a person who can access the login page can intentionally select another player's name.

The rebuild should **not invent a PIN requirement** to fix this because doing so changes the approved product behavior.

The architecture should make future optional PIN/password activation possible without restructuring the whole app.

---

# 6. Server-Side Authorization Rules

Authorization must be enforced on the server, not only by hiding UI controls.

## Admin-only mutations

- Create/update/delete Player.
- Mark/edit attendance.
- Add/edit attendance excuses directly.
- Modify monthly player statistics.
- Add Admin-created leave entries.
- Approve/deny leave requests.
- Approve/deny excuse requests.
- Approve/deny join requests.
- Add/delete finance entries.
- Add/delete Waano tips.
- Upload/delete gallery images.
- Edit club rules.
- Edit announcements.
- Record/change announcement audio.
- Create/update/delete training schedule entries.
- Access Admin dashboard data and approval inbox.

## Player-authorized mutations

A Player may only act as the player represented by the current session.

Allowed:

- Submit own excuse request.
- Submit own leave request.
- Submit own suggestion.
- Post a Team Chat message as self.
- Access permitted WhatsApp directory.
- Read global club content allowed to Players.

Not allowed:

- Mark attendance.
- Modify their own statistics.
- Approve requests.
- Edit finances.
- Edit rules.
- Upload/delete gallery media.
- Read another player's private attendance, leave history, or personal statistics through private endpoints.

---

# 7. Functional Inventory to Preserve

# 7.1 Admin Tabs

## Xogtaada — Home

Preserve:

- Today's weekday/date banner.
- Login/visit activity.
- Tappable Xadir/Maqan/Daahay counters.
- Expanded player-name lists.
- Excuse notes where applicable.
- Current-month Goals/Assists/Errors totals.
- Pending-request alert.

---

## Ciyaartoy — Players

Preserve:

- Full roster CRUD.
- Player profile fields.
- Position.
- Jersey number.
- WhatsApp.
- Nickname.
- Monthly Goals/Assists/Errors adjustment.
- Attendance-related player detail.
- Leave information.
- Direct Admin leave creation.
- Excuse text editing for applicable attendance statuses.

---

## Xaadiris — Attendance

Preserve:

- Date picker.
- Bulk roster attendance editor.
- Statuses:
  - `xadir`
  - `maqan`
  - `daahay`
- Immediate auto-save after status selection.
- Excuse/reason field for Maqan/Daahay.
- Explicit **Keydi Dhammaan** secondary confirmation.

**Critical:** do not return to a Save-All-only model.

---

## Natiijo — Statistics

Preserve current-month roster view with:

- Goals.
- Assists.
- Errors.
- Xadir count.
- Daahay count.
- Maqan count.

Historical month browsing is not part of the existing required behavior.

---

## Sawiro — Gallery

Preserve:

- Photo grid.
- Lightbox.
- Caption.
- Admin upload.
- Admin delete.
- Player read-only viewing.

Modernize storage:

- Client-side image optimization may remain.
- Store optimized file in Supabase Storage.
- Store metadata/path in PostgreSQL.
- Do not store Base64 media in the database.

---

## Waano

Preserve:

- Club tips/advice.
- Existing seeded content where source data is available.
- Admin add/delete.
- Player read-only access.

---

## Wadahadal — Team Chat

Preserve:

- Team-wide message wall.
- Messages visible to all permitted club users.
- Player posts under their own identity.
- Admin posts under Admin identity.
- WhatsApp contact strip/directory.
- `wa.me` deep links.
- Non-digit characters stripped/normalized for WhatsApp links.

---

## Jadwal — Schedule

Preserve:

- Training schedule CRUD for Admin.
- Day name.
- Time.
- Place/location.
- Read-only Player view.
- Tapping a recurring weekday schedule row resolves the most recent attendance date matching that weekday.
- Expanded Xadir/Maqan/Daahay breakdown.

Somali weekday mapping:

| Somali | JS Day |
|---|---:|
| Axad | 0 |
| Isniin | 1 |
| Talaado | 2 |
| Arbaco | 3 |
| Khamiis | 4 |
| Jimco | 5 |
| Sabti | 6 |

---

## Lacagta — Finance

Preserve:

- Income entries.
- Expense entries.
- Notes.
- Dates.
- Total income.
- Total expense.
- Balance.
- Admin add/delete.
- Player read-only financial view.

No payment gateway is being added.

---

## Sharci — Rules and Announcement

Preserve:

- Full club rules text.
- Admin edit.
- Player read-only view.
- Text announcement.
- Voice announcement recording/playback.

Modernize audio storage:

- Browser `MediaRecorder` may continue to capture audio.
- Upload audio blob to Supabase Storage.
- Store object metadata/path in PostgreSQL.
- Do not persist Base64 audio in an ordinary row.

---

## Codsi — Requests

Preserve unified Admin approvals for:

1. Join requests.
2. Excuse requests.
3. Leave requests.

---

# 7.2 Player Tabs

## Xogtaada

Preserve:

- Announcement.
- Voice announcement playback.
- Current-month Goals/Assists/Errors.
- Leave-used counter.

---

## Xaadiris

Preserve:

- Today's attendance status.
- Excuse note where available.
- Personal attendance history.
- Existing recent-history behavior.
- Submit excuse request:
  - date
  - Maqan/Daahay type
  - reason
- Request status:
  - pending
  - approved
  - denied

Player cannot mark attendance.

---

## Jadwal

Preserve read-only schedule and schedule-linked attendance lookup.

---

## Fasax

Preserve:

- Submit own leave request.
- Date defaults to today.
- Free-text reason.
- Monthly limit concept of 3 non-denied requests.
- Personal request history.
- Pending/approved/denied badges.

### Specification ambiguity to preserve carefully

The source specification describes the monthly limit as an enforced cap in the feature inventory/business rules, but the workflow section also describes the current implementation as a client-side **soft cap**.

Do not strengthen or redesign this rule silently.

During implementation, reproduce the behavior of the existing live app if it can be inspected. If the live behavior cannot be inspected, stop and ask the requirements owner whether a fourth request should be blocked or only warned.

---

## Fikrad

Preserve:

- Submit suggestion/feedback to coach.
- Player sees own submission history only.
- Players do not browse other players' suggestions.

---

## Sawiro

Read-only gallery.

---

## Waano

Read-only club tips.

---

## Wadahadal

Preserve shared chat and WhatsApp directory.

---

## Lacagta

Read-only finance view.

---

## Sharci

Read-only rules and announcements.

---

# 8. Data Model

The old single `club-data` JSON object must be normalized into relational tables.

Recommended application schema:

```text
auth_user                 Better Auth
auth_session              Better Auth
auth_account              Better Auth
auth_verification         Better Auth

players
attendance_records
attendance_excuses
excuse_requests
player_monthly_stats
leave_requests
join_requests
suggestions
finance_entries
tips
chat_messages
login_logs
schedule_entries
gallery_photos
club_settings
```

Table names may be adjusted during implementation, but the domain boundaries should remain recognizable.

---

## 8.1 players

Suggested fields:

```text
id
auth_user_id nullable/unique as required by final auth implementation
name
nickname
position
jersey_number
whatsapp
legacy_pin nullable
is_active
created_at
updated_at
```

The legacy `pin` may be migrated for data preservation but must remain unused unless the owner explicitly re-enables PIN login.

---

## 8.2 attendance_records

One row per player/date.

```text
id
player_id
attendance_date
status enum(xadir, maqan, daahay)
created_at
updated_at
```

Unique constraint:

```text
(player_id, attendance_date)
```

---

## 8.3 attendance_excuses

```text
id
player_id
attendance_date
reason
created_by
created_at
updated_at
```

Only relevant for Maqan/Daahay in normal UI behavior.

---

## 8.4 excuse_requests

```text
id
player_id
request_date
attendance_type enum(maqan, daahay)
reason
status enum(pending, approved, denied)
reviewed_at
reviewed_by
created_at
updated_at
```

Approval should also write/update the permanent attendance excuse record according to the existing workflow.

---

## 8.5 player_monthly_stats

```text
id
player_id
month_key       YYYY-MM
goals
assists
errors
created_at
updated_at
```

Unique constraint:

```text
(player_id, month_key)
```

---

## 8.6 leave_requests

```text
id
player_id
leave_date
reason
status enum(pending, approved, denied)
created_by_role
reviewed_at
reviewed_by
created_at
updated_at
```

Admin-authored direct leave entries should be created as approved immediately, matching the current workflow.

---

## 8.7 join_requests

```text
id
name
phone
message
status enum(pending, approved, denied)
reviewed_at
reviewed_by
created_at
updated_at
```

Approval creates a Player record.

---

## 8.8 suggestions

```text
id
player_id
text
submission_date
created_at
```

---

## 8.9 finance_entries

```text
id
type enum(income, expense)
amount decimal
note
entry_date
created_at
updated_at
```

Use a proper decimal/numeric database type for money.

---

## 8.10 tips

```text
id
text
sort_order nullable
created_at
updated_at
```

---

## 8.11 chat_messages

```text
id
author_role enum(admin, player)
player_id nullable
author_name_snapshot
text
created_at
```

Keep a display-name snapshot if desired so historical messages remain understandable after player renames.

---

## 8.12 login_logs

```text
id
role enum(admin, player)
player_id nullable
display_name
logged_in_at
```

Retain only the most recent records according to the product's current capped-history behavior, or perform scheduled cleanup.

Current specification cap: **200 entries**.

---

## 8.13 schedule_entries

```text
id
day_name
time_text
place
created_at
updated_at
```

Preserve freeform time text unless requirements explicitly change.

---

## 8.14 gallery_photos

```text
id
storage_bucket
storage_path
caption
uploaded_by
created_at
```

The binary image is stored in Supabase Storage.

---

## 8.15 club_settings

Suitable for small singleton/global values:

```text
id
rules_text
announcement_text
announcement_audio_path nullable
admin_whatsapp nullable
updated_at
```

Do not put Admin passwords here.

---

# 9. Core Workflow Preservation

## 9.1 Login

```text
Open app
  ↓
Load public/minimal login data
  ↓
Admin / Player selector
  ├── Admin → username + password → Better Auth session
  └── Player → select roster name → secure player session
  ↓
Append login log
  ↓
Open role-specific Xogtaada
```

---

## 9.2 Attendance

```text
Admin chooses date
  ↓
Load roster + existing attendance
  ↓
Tap Xadir / Maqan / Daahay
  ↓
Server mutation
  ↓
Database upsert
  ↓
UI confirmation
```

Every status tap should persist immediately.

For Maqan/Daahay:

```text
Reason entered
  ↓
Save on blur / explicit suitable event
  ↓
Server validation
  ↓
Database upsert
```

Keep **Keydi Dhammaan** as a secondary confirmation/re-save action.

---

## 9.3 Excuse Request

```text
Player submits request
  ↓
pending
  ↓
Admin reviews
  ├── Approve → approved + write permanent excuse
  └── Deny → denied
  ↓
Player sees updated status
```

---

## 9.4 Leave Request

```text
Player submits leave
  ↓
pending
  ↓
Admin approves/denies
  ↓
Player sees history/status
```

Admin-created leave:

```text
Admin creates leave for Player
  ↓
Immediately approved
```

---

## 9.5 Join Request

```text
Prospective player submits:
name + phone + message
  ↓
pending
  ↓
Admin approves
  ↓
Create Player record
```

Do not automatically invent additional onboarding requirements.

---

## 9.6 Gallery Upload

```text
Admin selects image
  ↓
Validate image
  ↓
Resize/compress client-side
  ↓
Upload to Supabase Storage
  ↓
Insert gallery_photos metadata row
  ↓
Refresh gallery
```

The existing target of approximately 480px-wide compressed images may be retained for lightweight mobile usage unless image-quality requirements change.

---

## 9.7 Voice Announcement

```text
Admin starts MediaRecorder
  ↓
Record audio
  ↓
Stop
  ↓
Create Blob
  ↓
Upload to Supabase Storage
  ↓
Save object path in club_settings
  ↓
Player/Admin playback
```

If microphone permission is denied, text announcements must continue to function.

---

## 9.8 Schedule Attendance Lookup

```text
Tap recurring weekday
  ↓
Map Somali weekday → JS weekday number
  ↓
Find most recent attendance date matching weekday
  ↓
Group players:
Xadir / Maqan / Daahay
```

Do not silently convert the schedule to fixed-date events.

---

# 10. UI / UX Preservation

Preserve the existing mobile-first identity.

## Visual tokens

Existing specification values:

```text
pitchDark / pitch  #132018
gold               #C9A24B
chalk               #F4EFE1
red                 #B4432F
amber               #C08A2E
green               success status
```

Supporting darker/dimmer tokens should be carried forward from the existing design.

## Typography

Preserve:

- **Oswald** for headings, numbers, buttons, and tab labels.
- **Inter** for body text and inputs.

## Layout

- Mobile-first.
- Centered constrained application column on larger displays.
- Fixed bottom navigation.
- Horizontal scrolling when tabs exceed phone width.
- Icon + Somali label.
- Active tab highlighted with gold.
- Top app bar with branding, role/player identity, and logout.

Do not redesign into a desktop admin template unless explicitly requested.

---

# 11. Shared Component Library

Recommended reusable components:

```text
TicketCard
SectionTitle
StatTile
TextField
TextArea
PrimaryButton
GhostButton
StatusBadge
EmptyState
BottomNavigation
TopBar
LoadingState
ErrorState
ConfirmDialog
Toast
```

Existing component concepts should remain visually recognizable.

---

# 12. Error Handling Improvements

The rebuild must fix persistence failures without changing product behavior.

## Reads

If data retrieval fails:

- Show an understandable Somali error/retry state.
- Avoid an unexplained white screen.
- Do not seed/overwrite production data merely because a read temporarily fails.

## Writes

Never silently pretend a failed database write succeeded.

Required pattern:

```text
User action
  ↓
optimistic UI only where safe
  ↓
server mutation
  ├── success → confirm
  └── failure → restore/revalidate + visible retry/error message
```

Attendance requires special care because rapid status changes are common.

---

# 13. Validation

React's escaping protects normal text rendering from basic JSX XSS, but server-side validation is still required.

Validate:

- Required fields.
- String length limits.
- Numeric amount ranges.
- Jersey number values.
- Date formats.
- Attendance enum values.
- Request enum values.
- Media MIME type.
- Media size.
- Phone normalization.
- Authorization ownership.

Do not add profanity filtering or other content-moderation behavior unless requested; that would be a product change.

---

# 14. Media Security

For Supabase Storage:

Recommended buckets:

```text
club-gallery
club-audio
```

Policies should reflect the application access model.

### Gallery

- Admin: upload/delete.
- Authenticated club users: read.

### Announcement audio

- Admin: upload/replace/delete.
- Authenticated club users: read.

If public bucket URLs are chosen for simplicity, confirm that this exposure is acceptable before production. Prefer protected access for club-only media.

---

# 15. Data Privacy

Player personal data includes:

- Full name.
- WhatsApp number.
- Attendance.
- Statistics.
- Leave history.
- Excuse information.

Preserve current product visibility:

- Admin can access all Player records.
- Player sees their own private attendance/stats/leave data.
- Team Chat deliberately exposes the team WhatsApp directory to Players.

The rebuild must not accidentally expose private player API responses because a frontend component happens to hide them.

---

# 16. Environment Variables

Expected environment variables will include values similar to:

```env
# Database
DATABASE_URL=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Public application URL where needed
VITE_APP_URL=
```

Exact variable names should be finalized based on the implementation.

### Rules

- Never commit `.env` files containing secrets.
- Add local secrets to `.env.local`.
- Configure Production/Preview/Development values in Vercel.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser/client code.
- Never expose `DATABASE_URL` to browser/client code.

---

# 17. Suggested Project Structure

```text
best-official-app/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── attendance/
│   │   ├── players/
│   │   ├── gallery/
│   │   ├── chat/
│   │   └── ...
│   │
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── admin/
│   │   └── player/
│   │
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema/
│   │   └── queries/
│   │
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── auth-client.ts
│   │   ├── authorization.ts
│   │   ├── supabase.ts
│   │   ├── validation.ts
│   │   ├── dates.ts
│   │   └── whatsapp.ts
│   │
│   ├── server/
│   │   ├── players/
│   │   ├── attendance/
│   │   ├── requests/
│   │   ├── finance/
│   │   ├── gallery/
│   │   ├── schedule/
│   │   └── ...
│   │
│   └── styles/
│
├── drizzle/
├── public/
├── tests/
├── drizzle.config.ts
├── vite.config.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

Exact TanStack Start conventions should follow the current official scaffold when implementation starts.

---

# 18. Data Migration Strategy

The existing storage model consists primarily of:

```text
club-data
club-gallery
```

The rebuild should support a one-time migration if the original JSON values can be exported.

## Migration mapping

```text
credentials.adminUser         → Better Auth Admin user
credentials.adminPass         → DO NOT migrate plaintext directly as a reusable stored password
players                       → players
attendance                    → attendance_records
excuses                       → attendance_excuses
excuseRequests                → excuse_requests
stats                         → player_monthly_stats
leaves                        → leave_requests
joinRequests                  → join_requests
suggestions                   → suggestions
finance                       → finance_entries
tips                          → tips
teamChat                      → chat_messages
loginLog                      → login_logs
schedule                      → schedule_entries
rules                         → club_settings.rules_text
announcement                  → club_settings.announcement_text
announcementAudio             → Supabase Storage + club_settings path
club-gallery                  → Supabase Storage + gallery_photos
```

### Admin password migration

Do not copy a plaintext legacy Admin password into a general application table.

During migration, create/reset the Admin credential through Better Auth's secure password mechanism.

---

# 19. Migration Integrity Checks

After migration verify:

- Player count matches.
- Jersey numbers match.
- Positions match.
- WhatsApp values match.
- Attendance totals by date/status match.
- Excuse reasons match.
- Monthly statistics match.
- Leave histories/statuses match.
- Join-request statuses match.
- Suggestions match.
- Finance totals match.
- Tips count/content match.
- Chat history matches where retained.
- Login log count matches expected cap.
- Schedule entries match.
- Rules text matches.
- Announcement text matches.
- Gallery count/captions match.
- Audio announcement works where legacy audio is available.

---

# 20. Testing Requirements

## 20.1 Unit tests

Test:

- Somali weekday mapping.
- Month-key generation.
- Finance totals.
- Attendance counts.
- Status grouping.
- Leave-count logic.
- WhatsApp normalization.
- Authorization helpers.

## 20.2 Integration tests

Test server/database behavior:

- Admin can update attendance.
- Player cannot update attendance.
- Player can only query own private records.
- Excuse approval writes permanent excuse.
- Leave approval changes status.
- Join approval creates a Player.
- Gallery Admin authorization.
- Finance Admin authorization.
- Statistics month isolation.

## 20.3 End-to-end tests

Minimum critical flows:

### Admin

1. Login.
2. Add/edit Player.
3. Mark attendance and navigate away.
4. Return and confirm attendance persisted.
5. Approve excuse.
6. Approve leave.
7. Approve join request.
8. Upload/delete gallery image.
9. Add finance entry.
10. Edit rules/announcement.
11. Record/upload voice announcement.
12. Logout.

### Player

1. Select name and login.
2. View dashboard.
3. View personal attendance.
4. Submit excuse.
5. Submit leave.
6. Submit suggestion.
7. Post Team Chat message.
8. Open WhatsApp contact.
9. View schedule attendance breakdown.
10. View gallery/Waano/finance/rules.
11. Logout.

---

# 21. Vercel Deployment Plan

## Production flow

```text
Local Development
      ↓
Git repository
      ↓
Vercel Preview Deployments
      ↓
Automated tests/build
      ↓
Production deployment
```

## Vercel configuration

Configure:

- Supabase database connection string/pooler.
- Better Auth secret.
- Production application URL.
- Supabase project URL/keys.
- Storage-related credentials if needed.

Use separate environment-variable scopes for:

- Development.
- Preview.
- Production.

Avoid allowing Preview deployments to mutate Production data unless explicitly intended.

---

# 22. Supabase Environment Separation

Preferred:

```text
Development DB / Supabase project
Production DB / Supabase project
```

At minimum, do not use destructive development migration/reset commands against the production database.

---

# 23. Performance Guidance

The club is small, so simplicity is more valuable than premature distributed-system complexity.

Recommended:

- Server-side authorization on every protected operation.
- Query only data needed for the active screen.
- Paginate or limit chat/log history as it grows.
- Keep optimized gallery images.
- Use storage URLs instead of Base64.
- Add database indexes for commonly filtered columns.

Suggested indexes:

```text
attendance_records(player_id, attendance_date)
attendance_records(attendance_date)
excuse_requests(player_id, status)
leave_requests(player_id, leave_date)
player_monthly_stats(player_id, month_key)
chat_messages(created_at)
login_logs(logged_in_at)
```

---

# 24. Business Rules That Must Not Drift

1. Attendance is Admin-authoritative.
2. Players cannot self-mark attendance.
3. Excuse text belongs to Maqan/Daahay behavior.
4. Goals/Assists/Errors are month-scoped.
5. Schedule entries represent recurring weekdays.
6. Schedule attendance view resolves the latest matching weekday.
7. Join approval creates a roster Player.
8. Admin can also add a Player manually.
9. Global club content remains globally visible according to current role rules.
10. Player private attendance/stats/leave data is self-only.
11. WhatsApp team directory remains available through Team Chat.
12. No Player password is introduced without explicit approval.
13. Attendance status taps auto-save.
14. The Save All attendance control remains only a secondary safety action.
15. Current Somali UI remains the primary language.
16. No payment processing is added.
17. No push-notification system is added unless separately requested.

---

# 25. Explicit Non-Goals for This Rebuild

Unless separately approved, do not add:

- Multi-club SaaS architecture.
- Super-admin dashboard.
- Multiple coaching organizations.
- Player passwords/PINs.
- Email verification for Players.
- Payment gateway.
- Subscription billing.
- Push notifications.
- SMS gateway.
- WhatsApp Business API.
- Native Android rewrite.
- Native iOS rewrite.
- Desktop-first redesign.
- Public player profiles.
- Social-media features.
- AI features.
- Advanced football analytics.
- Historical-month statistics browser.
- Offline-first synchronization.
- Multi-language switcher.

These may be future enhancements, but they are not part of the current rebuild.

---

# 26. Existing Features That Are Being Technically Replaced, Not Removed

| Existing Implementation | Rebuild Implementation |
|---|---|
| React client-only SPA | TanStack Start full-stack React |
| JavaScript/JSX | TypeScript/TSX |
| `window.storage` | Supabase PostgreSQL |
| One giant shared JSON document | Relational Drizzle schema |
| Client-side credential comparison | Better Auth |
| UI-only authorization | Server-side authorization |
| Base64 gallery storage | Supabase Storage |
| Base64 voice audio | Supabase Storage |
| Silent failed writes | Visible/recoverable server errors |
| Single huge component/file | Modular routes/components/server modules |
| Hardcoded data mutation logic | Typed server functions + domain services |

The user-facing purpose remains the same.

---

# 27. Implementation Priorities

Recommended sequence:

### Phase 1 — Foundation

- Scaffold TanStack Start + TypeScript.
- Configure Tailwind.
- Recreate existing design tokens.
- Configure Supabase.
- Configure Drizzle.
- Configure Better Auth.
- Configure Vercel-safe environment handling.

### Phase 2 — Database

- Create relational schema.
- Create migrations.
- Seed necessary base content.
- Build typed domain queries/mutations.

### Phase 3 — Authentication and Authorization

- Admin authentication.
- Player no-password session compatibility flow.
- Role and ownership checks.
- Login logging.

### Phase 4 — Core Club Management

- Players.
- Attendance.
- Statistics.
- Excuses.
- Leaves.
- Requests.

### Phase 5 — Shared Features

- Schedule.
- Finance.
- Waano.
- Suggestions.
- Team Chat.
- WhatsApp directory.
- Rules.
- Announcements.

### Phase 6 — Media

- Gallery.
- Image optimization.
- Supabase Storage.
- Voice recording.
- Voice upload/playback.

### Phase 7 — Migration

- Import legacy data.
- Validate record counts and totals.

### Phase 8 — QA

- Unit tests.
- Integration tests.
- End-to-end tests.
- Mobile-browser testing.
- Authorization/security checks.

### Phase 9 — Vercel

- Preview deployment.
- Production environment variables.
- Database migration.
- Production deployment.
- Smoke test.

---

# 28. Definition of Done

The rebuild is complete when:

- The current Admin workflows function.
- The current Player workflows function.
- UI remains Somali and familiar.
- Player attendance remains Admin-only.
- Player login remains passwordless/name-selection based.
- All persistent records use Supabase PostgreSQL.
- Drizzle manages application database schema/migrations.
- Better Auth manages secure server-side sessions/authentication.
- Sensitive authorization is enforced server-side.
- Gallery and voice media use Supabase Storage.
- Failed writes are visible/recoverable.
- The application builds successfully.
- Automated critical tests pass.
- Vercel Preview works.
- Vercel Production works.
- Production environment secrets are configured safely.
- Migrated data has been verified against the original app/export.
- No unapproved product behavior has been changed.

---

# 29. Items Requiring Owner Confirmation Only If Encountered

Do not block initial scaffolding on these, but ask before changing behavior:

1. Whether the Player monthly 3-leave rule should hard-block a fourth request or only warn.
2. Whether the existing legacy PIN field should be retained only for migration history or removed after data migration.
3. Whether club media should require authenticated/private Storage access or may use public URLs.
4. The final production Admin username/password during account provisioning.
5. Which gallery photos are canonical if multiple legacy sets exist.
6. Whether a bespoke final crest/logo will replace the current crown-icon interim branding.

---

# 30. Source-of-Truth Priority

When requirements conflict, use this order:

1. **Direct new instruction from the project owner.**
2. **Existing BEST OFFICIAL APP Complete System Specification.**
3. **Observed behavior of the current live application.**
4. **This rebuild specification.**
5. **Developer preference/convention.**

Never change product behavior solely because a different behavior is more conventional technically.

---

# 31. Technical Verification Notes — 2026-08-29

This stack was rechecked against current official documentation before this document was created.

Confirmed:

- TanStack Start is a full-stack React framework powered by TanStack Router.
- TanStack Start documentation includes Vercel deployment.
- TanStack Start is currently documented as Release Candidate.
- Drizzle officially documents use with Supabase PostgreSQL.
- Supabase connection pooling is appropriate for serverless-style deployments.
- Drizzle's Supabase guidance calls for disabling prepared statements when using Transaction pool mode.
- Better Auth supports a Drizzle PostgreSQL adapter.
- Better Auth supports extensibility through plugins/custom endpoints, which can be used to preserve the project's non-standard Player login behavior.
- Supabase Storage supports files/buckets/access policies and is suitable for the gallery and voice-media replacement.

---

# 32. Official Documentation References

- TanStack Start Overview: https://tanstack.com/start/latest/docs/framework/react/overview
- TanStack Start Hosting: https://tanstack.com/start/latest/docs/framework/react/guide/hosting
- Vercel TanStack Start Template: https://vercel.com/templates/template/tanstack-start-on-vercel
- Drizzle + Supabase: https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
- Drizzle Supabase Getting Started: https://orm.drizzle.team/docs/get-started/supabase-new
- Better Auth Installation: https://better-auth.com/docs/installation
- Better Auth Drizzle Adapter: https://better-auth.com/docs/adapters/drizzle
- Better Auth Plugins: https://better-auth.com/docs/concepts/plugins
- Better Auth Anonymous Plugin: https://better-auth.com/docs/plugins/anonymous
- Better Auth Username Plugin: https://better-auth.com/docs/plugins/username
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase Storage Quickstart: https://supabase.com/docs/guides/storage/quickstart

---

# 33. Final Architecture Decision

```text
BEST OFFICIAL APP
│
├── TanStack Start
│   ├── React
│   ├── TypeScript
│   ├── TanStack Router
│   ├── TanStack Query (where useful)
│   └── Tailwind CSS
│
├── Better Auth
│   ├── Secure Admin authentication
│   ├── Secure sessions
│   ├── Server-side role checks
│   └── Player no-password compatibility flow
│
├── Drizzle ORM
│   ├── Typed schema
│   ├── Migrations
│   └── Queries
│
├── Supabase
│   ├── PostgreSQL
│   └── Storage
│       ├── Gallery images
│       └── Voice announcements
│
└── Vercel
    ├── Preview deployments
    └── Production deployment
```

**Final principle:**  
**Modernize the implementation. Preserve the BEST OFFICIAL APP.**
