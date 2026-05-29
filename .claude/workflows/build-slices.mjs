export const meta = {
  name: 'build-slices',
  description: 'Build the 6 Coffee & Gospel feature slices (8 agents, disjoint routes) + adversarial review/fix each',
  phases: [{ title: 'Build' }, { title: 'Review' }],
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT — every build/review agent receives this. It is the API surface the
// slices must code against. The foundation (lib/db, lib/auth, lib/i18n, helpers,
// shadcn ui, site shell) already exists and compiles.
// ─────────────────────────────────────────────────────────────────────────────
const CONTRACT = `
You are building one feature slice of "Coffee & Gospel", a church café + gospel web app.
Working dir is the repo root. Read CONTEXT.md and docs/PLAN.md for the domain and invariants.

STACK & RULES (non-negotiable):
- Next.js 16 App Router, React 19, strict TypeScript with verbatimModuleSyntax + noUncheckedIndexedAccess.
  * Use \`import type\` for type-only imports.
  * Array/record index access yields T | undefined — guard it.
  * NO \`any\`, NO \`@ts-ignore\`, NO \`eslint-disable\`, NO non-null \`!\` on user data.
- Server Components by default. Add \`'use client'\` ONLY for interactivity (forms, geolocation, cart state, toasts).
- Mutations = Server Actions in a file under \`lib/actions/<name>.ts\` with \`'use server'\` at the top
  (every export in such a file MUST be an async function). Validate ALL inputs with Zod (zod v4).
- Tailwind v4 + shadcn/ui. Import UI ONLY from \`@/components/ui/*\` (do NOT import radix directly, do NOT run \`shadcn add\`).
  Available: button, input, label, card, badge, separator, textarea, select, sonner, dialog,
  dropdown-menu, tabs, sheet, table, skeleton, avatar. Use \`cn\` from \`@/lib/utils\` for conditional classes.
- Toasts: \`import { toast } from 'sonner'\` (client only).
- Bilingual th/en is mandatory for every user-facing string. Thai is default.

DATA LAYER (Drizzle, node-postgres, snake_case columns from camelCase keys):
  import { db } from '@/lib/db'
  import { users, sessions, services, attendances, siteConfig, menuItems, orders, orderItems, classOfferings, enrollments } from '@/lib/db/schema'
  import type { User, MenuItem, Order, ClassOffering /* etc */ } from '@/lib/db/schema'
  import { eq, and, or, desc, asc, inArray, count, sql } from 'drizzle-orm'
  Examples:
    const items = await db.select().from(menuItems).where(eq(menuItems.available, true)).orderBy(asc(menuItems.sortOrder))
    const [row] = await db.insert(orders).values({ userId, pickupCode, status: 'pending' }).returning()
    await db.update(orders).set({ status: 'ready', readyAt: new Date() }).where(eq(orders.id, id))
    await db.transaction(async (tx) => { /* ... */ })
    const o = await db.query.orders.findFirst({ where: eq(orders.id, id), with: { items: true, user: true } })
  Column notes: \`time\` columns come back as strings "HH:MM:SS"; \`date\` columns as "YYYY-MM-DD" strings;
  timestamps as JS Date; doublePrecision as number. NEVER expose users.passwordHash to the client.

SCHEMA (columns):
  users(id, name, email[unique], phone?, passwordHash, role['admin'|'staff'|'member'|'visitor', def visitor],
        orderingEnabled[bool def false], locale[def 'th'], createdAt, updatedAt)
  sessions(id[token hash], userId, expiresAt, createdAt)
  services(id, nameTh, nameEn, dayOfWeek[0=Sun..6=Sat], startTime, endTime, active)
  attendances(id, userId, serviceId?, serviceDate[date], checkedInAt, latitude, longitude, distanceMeters,
              verified[bool], method['gps'|'staff'|'qr']) — UNIQUE(userId, serviceDate)
  siteConfig(id[=1], churchLat, churchLng, checkinRadiusMeters, addressTh?, addressEn?, mapEmbedUrl?, phone?, updatedAt)
  menuItems(id, slug[unique], nameTh, nameEn, descriptionTh?, descriptionEn?, imageUrl?, category[def 'coffee'],
            available[bool def true], sortOrder, createdAt, updatedAt)
  orders(id, userId, status['pending'|'preparing'|'ready'|'completed'|'cancelled' def pending], pickupCode, note?,
         createdAt, readyAt?, completedAt?, updatedAt)
  orderItems(id, orderId, menuItemId?, nameSnapshotTh, nameSnapshotEn, quantity[def 1], note?)
  classOfferings(id, slug[unique], kind['english'|'guitar'|'japanese'], nameTh, nameEn, descriptionTh?, descriptionEn?,
                 level?, dayOfWeek[def 6], startTime, endTime, capacity?, active, sortOrder)
  enrollments(id, classOfferingId, userId?, guestName?, guestPhone?, status['enrolled'|'waitlisted'|'cancelled' def enrolled], createdAt)

AUTH (import from '@/lib/auth'):
  getCurrentUser(): Promise<User | null>   // cached per request
  requireUser(): Promise<User>             // redirects to /login if absent
  requireRole(...roles): Promise<User>     // redirects to / if role not allowed
  requireOrderingEnabled(): Promise<User>  // redirects to /account if !orderingEnabled
  hashPassword(pw), verifyPassword(pw, stored), generateSessionToken(),
  createSession(token, userId) -> Session{ id, userId, expiresAt }, invalidateSession(token),
  setSessionCookie(token, expiresAt), deleteSessionCookie(), getSessionToken()
  Login pattern:  const token = generateSessionToken(); const s = await createSession(token, user.id); await setSessionCookie(token, s.expiresAt)
  Logout pattern: const tk = await getSessionToken(); if (tk) await invalidateSession(tk); await deleteSessionCookie()

I18N / CONTENT:
  import { getLocale } from '@/lib/locale'           // Promise<'th'|'en'>, from cookie, default 'th'
  import { t, pick } from '@/lib/i18n'                // t(localized, locale); pick(thStr, enStr, locale)
  import { site } from '@/content/site'              // typed bilingual landing content
  Render DB bilingual rows with: pick(item.nameTh, item.nameEn, locale)

HELPERS:
  import { bangkokNow, timeToMinutes, formatTime } from '@/lib/datetime'
    bangkokNow() -> { dayOfWeek, minutes, time:'HH:MM', date:'YYYY-MM-DD' } in Asia/Bangkok
  import { haversineMeters, isWithinRadius } from '@/lib/geo'   // (LatLng, LatLng[, radius])
  import { generatePickupCode } from '@/lib/order-code'
  import { cn } from '@/lib/utils'
  import { type FormState, IDLE_FORM_STATE, type ActionResult } from '@/lib/forms'
  Form actions use useActionState with signature (prev: FormState, formData: FormData) => Promise<FormState>.
  Direct (non-form) actions return ActionResult<T>.
  After mutations call revalidatePath(...) from 'next/navigation'... NO — import { revalidatePath } from 'next/cache'.
  Navigate after success with redirect() from 'next/navigation' (redirect throws; call it OUTSIDE try/catch).

DO NOT TOUCH (read-only for you): app/layout.tsx, app/(site)/layout.tsx, components/site-header.tsx,
  components/site-footer.tsx, components/ui/*, lib/db/schema.ts, lib/db/index.ts, lib/auth/*, lib/env.ts,
  lib/i18n.ts, lib/locale.ts, lib/datetime.ts, lib/geo.ts, lib/order-code.ts, lib/forms.ts, content/site.ts.
  Do NOT run: npm install, shadcn add, drizzle-kit, tsc, or next build (the orchestrator compiles & verifies).
  Only create/edit the files listed in YOUR slice. Namespace your components under the folder given.

INVARIANTS you must enforce SERVER-SIDE (never trust the client):
  1. Placing an order requires orderingEnabled === true (use requireOrderingEnabled or check server-side).
  2. GPS check-in: the SERVER computes haversine distance vs siteConfig coords AND checks the current
     Bangkok time is inside an active service window. The client only sends lat/lng.
  3. One verified attendance flips a visitor's orderingEnabled to true. One check-in per (user, serviceDate).
  4. Sessions/passwords go through the auth lib only. Never render passwordHash.
  5. Coffee is FREE — there is NO price field and NO payment anywhere. Do not invent one.
  6. Role-gate staff/admin pages with requireRole.

Write clean, production-grade, warm-but-modern UI. Keep it responsive and accessible.
`

const BUILD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slice', 'filesWritten', 'serverActions', 'invariantsEnforced', 'notes'],
  properties: {
    slice: { type: 'string' },
    filesWritten: { type: 'array', items: { type: 'string' } },
    serverActions: { type: 'array', items: { type: 'string' } },
    invariantsEnforced: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
}

const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['slice', 'issuesFound', 'fixesApplied', 'remainingConcerns', 'buildRisk'],
  properties: {
    slice: { type: 'string' },
    issuesFound: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'file', 'issue'],
        properties: {
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          file: { type: 'string' },
          issue: { type: 'string' },
        },
      },
    },
    fixesApplied: { type: 'array', items: { type: 'string' } },
    remainingConcerns: { type: 'array', items: { type: 'string' } },
    buildRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
}

const SLICES = [
  {
    key: 'landing',
    spec: `SLICE 1 — LANDING (the front door). Owns ONLY: app/(site)/page.tsx and components/landing/*.tsx.
Replace the placeholder landing with a warm, modern, fully responsive marketing page using content from
@/content/site (await getLocale() and render with t(...)). Sections, in order:
  - Hero: tagline pill, big heading (site.hero.heading), body (site.hero.body), two CTAs:
    primary -> /menu (site.hero.primaryCta), secondary -> /signup (site.hero.secondaryCta "First time here?").
  - "What is the good news?" (site.gospel) — calm, inviting.
  - Our café story (site.story).
  - "What to expect on your first visit" (site.firstVisit.steps) as 3 numbered cards.
  - Free Saturday classes teaser (site.classesTeaser) with a CTA -> /classes.
  - A closing "come visit us" band.
Use shadcn Card/Button/Badge/Separator. Optional subtle framer-motion fade/slide on scroll (keep it tasteful;
framer-motion is installed — use 'use client' only for animated wrappers in components/landing). Coffee-warm palette
via existing CSS tokens (bg-background, text-foreground, text-muted-foreground, bg-primary, etc.). No DB calls.`,
  },
  {
    key: 'auth',
    spec: `SLICE 2 — ACCOUNTS. Owns ONLY: app/(site)/login/page.tsx, app/(site)/signup/page.tsx,
app/(site)/account/page.tsx, lib/actions/auth.ts, components/auth/*.tsx.
- lib/actions/auth.ts ('use server'): signupAction & loginAction as useActionState handlers
  (prev: FormState, formData: FormData) => Promise<FormState>; logoutAction(): Promise<void>.
  * signup: Zod { name, email, password(min 8), phone? }. Lowercase/trim email. If email exists -> FormState error.
    Create user (role 'visitor', orderingEnabled false) with hashPassword. Create session + setSessionCookie. Then redirect('/account').
  * login: Zod { email, password }. Look up by email, verifyPassword. On fail -> FormState error "Invalid email or password".
    Create session + setSessionCookie. redirect('/account').
  * logout: invalidate session + deleteSessionCookie + redirect('/').
  (redirect() throws — call it after the try/catch, not inside it.)
- login & signup pages: server components that render client form components from components/auth using useActionState,
  show fieldErrors + message, a pending submit button, and a link to the other page. Bilingual via getLocale.
- account page: requireUser(). Show name, email, role, and ordering status:
  * if orderingEnabled -> green "You can order online" + button to /menu.
  * else (visitor) -> explain they must attend one service, with a prominent button to /checkin.
  Include a logout button (form action={logoutAction}). Show a short "my recent orders" placeholder link to /orders.`,
  },
  {
    key: 'checkin',
    spec: `SLICE 3 — GPS CHECK-IN. Owns ONLY: app/(site)/checkin/page.tsx, lib/actions/checkin.ts, components/checkin/*.tsx.
- lib/actions/checkin.ts ('use server'): checkInAction(input: { lat: number; lng: number }): Promise<ActionResult<{
    verified: boolean; distanceMeters: number; withinWindow: boolean; alreadyQualified: boolean; serviceName: string | null }>>.
  * requireUser(). Zod-validate lat/lng (finite, lat -90..90, lng -180..180).
  * Load siteConfig (id=1); if missing -> ActionResult error.
  * now = bangkokNow(). Find an active service where dayOfWeek === now.dayOfWeek AND
    timeToMinutes(startTime) <= now.minutes <= timeToMinutes(endTime). withinWindow = !!service.
  * distanceMeters = haversineMeters({lat:churchLat,lng:churchLng}, input). withinRadius = distance <= checkinRadiusMeters.
  * verified = withinWindow && withinRadius.
  * Insert attendance (serviceDate = now.date, lat/lng, distanceMeters, verified, method 'gps', serviceId = service?.id ?? null).
    Use onConflictDoNothing on the (userId, serviceDate) unique index (or catch the dup) so a second tap is idempotent.
  * If verified && user.role === 'visitor' && !user.orderingEnabled -> db.update(users).set({ orderingEnabled: true }).
  * Return the result. Set alreadyQualified from the user's pre-existing orderingEnabled.
- checkin page: requireUser(). If already orderingEnabled, show a "You're all set" state + link to /menu.
  Otherwise a client component (components/checkin) that: requests navigator.geolocation.getCurrentPosition,
  handles permission-denied / unavailable gracefully (clear bilingual message), calls checkInAction, and shows the
  outcome (success -> celebratory toast + link to /menu; out of range or outside service time -> helpful explanation
  with the measured distance and the next service time). Mobile-first.`,
  },
  {
    key: 'menu-orders',
    spec: `SLICE 4 — MENU + FREE ORDERING. Owns ONLY: app/(site)/menu/page.tsx, app/(site)/orders/page.tsx,
app/(site)/orders/[id]/page.tsx, lib/actions/orders.ts, components/menu/*.tsx, components/orders/*.tsx.
Remember: coffee is FREE. No prices, no payment — ever.
- menu page: server component. Load available menuItems ordered by sortOrder, grouped by category. Render bilingual
  cards (name + description via pick(), optional image). Determine the viewer with getCurrentUser():
    * not logged in -> each card shows a "Log in to order" note; CTA to /login.
    * logged in but !orderingEnabled -> banner "Attend one service to unlock online ordering" + button to /checkin; cards not orderable.
    * orderingEnabled -> render a client ordering UI (components/menu) with a cart (item + quantity + optional note),
      a floating cart summary, and a "Place order" button calling placeOrderAction.
- lib/actions/orders.ts ('use server'): placeOrderAction(input: { items: {menuItemId: string; quantity: number; note?: string}[]; note?: string }): Promise<ActionResult<{ orderId: string; pickupCode: string }>>.
  * requireOrderingEnabled(). Zod-validate (1..20 items, quantity 1..10). Load the referenced menuItems; reject if any
    missing or unavailable. Snapshot nameTh/nameEn. generatePickupCode(). Insert order + orderItems in a transaction.
    revalidatePath('/orders'). Return { orderId, pickupCode }. The client then router.push(\`/orders/\${orderId}\`).
- orders page: requireUser(). List the user's orders (newest first) with status badge + pickup code + item count.
- orders/[id] page: requireUser(). Load the order with items; 404/forbid if not owner (allow staff/admin to view).
  Big pickup code, status, ordered items, friendly "free — see you at the counter" message. (params is a Promise in Next 16: \`const { id } = await params\`.)`,
  },
  {
    key: 'classes',
    spec: `SLICE 5 — CLASSES (public). Owns ONLY: app/(site)/classes/page.tsx, lib/actions/classes.ts, components/classes/*.tsx.
- classes page: server component. Load active classOfferings ordered by sortOrder. Show a clear weekly schedule
  (all are Saturday): name (bilingual), level, time via formatTime(startTime)-formatTime(endTime), description, and a
  "FREE" badge. For each, an enroll affordance. Use getCurrentUser() to prefill.
- lib/actions/classes.ts ('use server'): enrollAction as a useActionState handler (prev: FormState, formData: FormData) => Promise<FormState>.
  * Zod: { classOfferingId(uuid), guestName?, guestPhone? }. If a user is logged in, enroll with userId (ignore guest fields);
    else require guestName + guestPhone.
  * Reject if the offering is missing/inactive. Prevent duplicates: same userId+class, or same guestPhone+class -> friendly message.
  * Capacity: if capacity != null and current enrolled count >= capacity -> status 'waitlisted', else 'enrolled'.
    Reflect which happened in the success message ("enrolled" vs "added to the waitlist"). revalidatePath('/classes').
- components/classes: a client enroll form/dialog (shadcn Dialog or inline) using useActionState; for logged-in users it
  just needs a confirm button; for guests it collects name + phone. Bilingual throughout.`,
  },
  {
    key: 'staff',
    spec: `SLICE 6 — STAFF COUNTER QUEUE. Owns ONLY: app/staff/layout.tsx, app/staff/page.tsx, lib/actions/staff.ts, components/staff/*.tsx.
(app/staff is OUTSIDE the (site) group, so build a minimal staff chrome in app/staff/layout.tsx.)
- app/staff/layout.tsx: requireRole('staff','admin'). Simple top bar: "Counter" title, link back to /, and the current
  user's name. Render children in a max-w container.
- app/staff/page.tsx: server component. Load active orders (status in pending/preparing/ready) oldest-first with items + customer name.
  Render columns/lists by status. Each order card: pickup code, customer first name, items, time waiting, and action buttons.
- lib/actions/staff.ts ('use server'): advanceOrderAction(input: { orderId: string; toStatus: 'preparing'|'ready'|'completed'|'cancelled' }): Promise<ActionResult>.
  * requireRole('staff','admin'). Zod-validate. Enforce a sane transition (pending->preparing->ready->completed; any non-terminal->cancelled).
    Set readyAt when ->ready, completedAt when ->completed, updatedAt always. revalidatePath('/staff').
- components/staff: client buttons calling advanceOrderAction with toast feedback + router.refresh(). Big, tap-friendly targets.`,
  },
  {
    key: 'admin-core',
    spec: `SLICE 7 — ADMIN CORE. Owns ONLY: app/admin/layout.tsx, app/admin/page.tsx, app/admin/config/page.tsx,
app/admin/services/page.tsx, app/admin/users/page.tsx, app/admin/attendance/page.tsx, lib/actions/admin-core.ts, components/admin/*.tsx.
(app/admin is OUTSIDE the (site) group — build admin chrome in app/admin/layout.tsx.)
- app/admin/layout.tsx: requireRole('admin'). Sidebar/top nav linking: Dashboard(/admin), Menu(/admin/menu),
  Classes(/admin/classes), Services(/admin/services), Site config(/admin/config), Users(/admin/users), Attendance(/admin/attendance).
  (Menu & Classes admin pages are built by another agent; just link to them.)
- app/admin/page.tsx: dashboard with quick counts (users, orders today, enrollments, attendances) via db count queries.
- app/admin/config/page.tsx + form: edit siteConfig (id=1): churchLat, churchLng, checkinRadiusMeters, addressTh/En, phone, mapEmbedUrl.
  Explain these power the GPS check-in. (Upsert id=1.)
- app/admin/services/page.tsx: list + create/edit/delete service windows (nameTh/En, dayOfWeek select 0-6, startTime, endTime, active).
- app/admin/users/page.tsx: table of users (name, email, role, orderingEnabled). Change role (select) and toggle orderingEnabled.
- app/admin/attendance/page.tsx: recent attendances table (user, date, verified, distanceMeters, method).
- lib/actions/admin-core.ts ('use server'): updateSiteConfig, createService, updateService, deleteService,
  setUserRole, setUserOrdering. ALL: requireRole('admin'), Zod-validated, revalidatePath the relevant page, return ActionResult.
- components/admin: shared admin UI (AdminNav, simple table/dialog form wrappers) used by these pages.
Use shadcn Table, Dialog, Select, Input, Button.`,
  },
  {
    key: 'admin-catalog',
    spec: `SLICE 8 — ADMIN CATALOG (menu + classes management). Owns ONLY: app/admin/menu/page.tsx,
app/admin/classes/page.tsx, lib/actions/admin-catalog.ts, components/admin-catalog/*.tsx.
(These live under app/admin and inherit the admin layout built by the admin-core agent — do NOT create app/admin/layout.tsx.)
- app/admin/menu/page.tsx: requireRole('admin'). Table of menuItems. Create/edit (slug, nameTh/En, descriptionTh/En,
  category, imageUrl, available, sortOrder) via shadcn Dialog form. Toggle available. Delete. NO price field (coffee is free).
- app/admin/classes/page.tsx: requireRole('admin'). Manage classOfferings (slug, kind select english/guitar/japanese,
  nameTh/En, descriptionTh/En, level, dayOfWeek, startTime, endTime, capacity, active, sortOrder). Create/edit/delete.
  PLUS for each offering, a roster view of its enrollments (name [user.name or guestName], phone, status, createdAt)
  with a count vs capacity.
- lib/actions/admin-catalog.ts ('use server'): createMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailable,
  createClassOffering, updateClassOffering, deleteClassOffering. ALL: requireRole('admin'), Zod-validated,
  revalidatePath the relevant admin page, return ActionResult. Reads for the roster can be done in the page (server component).
- components/admin-catalog: client dialog forms + tables. Use shadcn Table, Dialog, Select, Input, Textarea, Button, Badge.`,
  },
]

phase('Build')
log(`Building ${SLICES.length} slices in parallel, then reviewing each.`)

const results = await pipeline(
  SLICES,
  // Stage 1 — build the slice.
  (slice) =>
    agent(`${CONTRACT}\n\n=== YOUR SLICE ===\n${slice.spec}\n\nBuild it now. Create every file with the Write tool. Follow the contract exactly. Return the manifest.`, {
      label: `build:${slice.key}`,
      phase: 'Build',
      schema: BUILD_SCHEMA,
      agentType: 'general-purpose',
    }),
  // Stage 2 — adversarially review AND fix this slice's own files.
  (build, slice) =>
    agent(`${CONTRACT}\n\n=== SLICE UNDER REVIEW: ${slice.key} ===\n${slice.spec}\n\nThe build agent reported:\n${JSON.stringify(build, null, 2)}\n\nNow ADVERSARIALLY REVIEW the files this slice created (Read them from disk). Hunt specifically for:
- TypeScript errors that will fail a strict build (verbatimModuleSyntax: missing \`import type\`; noUncheckedIndexedAccess: unguarded index access; missing awaits; wrong Drizzle column/type usage; \`any\`).
- Client/Server boundary mistakes ('use client' files importing server-only modules like @/lib/db or @/lib/auth; calling cookies() in a client component; passing event handlers to server components).
- Server action correctness: 'use server' present, all exports async, Zod validation at the boundary, redirect() called OUTSIDE try/catch, revalidatePath from 'next/cache'.
- INVARIANT violations (see the contract): ordering gate, server-side GPS verification, free (no price/payment), role gates, passwordHash never sent to client.
- Wrong imports (must import UI from @/components/ui/*, helpers from the documented paths) or editing forbidden shared files.
FIX every issue you find by editing THIS SLICE's files only (the files in ${slice.key}'s ownership). Do NOT touch other slices or shared files. Do NOT run builds. Return the review report.`, {
      label: `review:${slice.key}`,
      phase: 'Review',
      schema: REVIEW_SCHEMA,
      agentType: 'general-purpose',
    }).then((review) => ({ slice: slice.key, build, review })),
)

const clean = results.filter(Boolean)
return {
  slicesBuilt: clean.map((r) => r.slice),
  results: clean,
}
