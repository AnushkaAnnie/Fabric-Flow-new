# Fabric Flow — Codebase Handoff Document

> **Purpose:** Complete context for any AI assistant (Claude, Gemini, etc.) to pick up and continue development on this project without needing to ask basic questions about the architecture, stack, or conventions.
> **Last Updated:** 2026-08-22

---

## 1. What Is This App?

**Fabric Flow** is an internal operations management system for a textile manufacturing business based in Tirupur, India. It tracks the end-to-end textile supply chain:

```
Yarn Purchase Order → Yarn Inward (Receipt) → Knitting → Dyeing → Compacting → Dispatch
```

The company:
- Sources **yarn** from Mills (e.g. SREE SIVA SELVI KNITTING)
- Delivers yarn to **Knitters** who knit it into grey fabric
- Sends grey fabric to **Dyers**
- Sends dyed fabric to **Compacters**
- Issues **Delivery Notes** and tracks **Inventory** throughout

The app handles: PO generation, inward tracking, lot management, inventory ledger, production planning, and memo/dispatch workflows.

---

## 2. Monorepo Structure

```text
Fabric-Flow-new/
├── apps/
│   ├── frontend/          ← Next.js 14 (App Router), deployed as static SPA on Render
│   └── textile-flow-svc/  ← NestJS REST API, deployed on Render (Node runtime)
├── packages/
│   ├── shared/            ← Shared DTOs, Zod schemas, and types (@textile-flow/shared)
│   ├── eslint-config/
│   └── typescript-config/
├── render.yaml            ← Render.com deployment config (both services)
├── turbo.json             ← Turborepo task orchestration
└── package.json           ← Root: npm workspaces + turbo
```

**Package Manager:** npm (v11.6.2). Uses npm workspaces. `bun.lock` exists but npm is canonical.
**Build System:** Turborepo (`npx turbo run dev/build`)
**Node Requirement:** >= 18

---

## 3. Backend — `apps/textile-flow-svc`

### Stack
| Layer | Tech |
|-------|------|
| Framework | **NestJS v11** |
| ORM | **Prisma v7.8** with `driverAdapters` preview feature |
| DB Driver | `@prisma/adapter-pg` (pg Pool) — **required**, raw PrismaClient won't work |
| Database | **Supabase PostgreSQL** (hosted, connection pooling via PgBouncer) |
| Auth | Supabase JWT verification — **globally enforced** via `APP_GUARD` |
| Validation | `class-validator` + `class-transformer` on most DTOs; **Zod** (`ZodValidationPipe`) on newer endpoints (e.g. `/compactings`) |
| Runtime port | `3001` |

### Key Gotcha — PrismaClient Initialization
**Critical:** This project uses `@prisma/adapter-pg`. You CANNOT use `new PrismaClient()` bare. Every instantiation — including scripts — must follow:
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
```
The NestJS service does this in `apps/textile-flow-svc/src/prisma/prisma.service.ts`.

### Start Commands
```bash
# From repo root (recommended — starts both frontend + backend concurrently)
npm run dev

# Backend only
cd apps/textile-flow-svc && npm run dev   # or: nest start --watch
```

### Environment Variables (backend — `apps/textile-flow-svc/.env`)
```env
DATABASE_URL="postgresql://...@...pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://...@...supabase.com:5432/postgres"
SUPABASE_URL=https://nvtyytyykdjhgtinhftd.supabase.co
SUPABASE_JWT_SECRET=<jwt-secret-from-supabase-dashboard>
```

### NestJS Modules (all registered in AppModule)

| Module | Route Prefix | Description |
|--------|-------------|-------------|
| `MillsModule` | `/mills` | Mill CRUD (yarn suppliers) |
| `KnittersModule` | `/knitters` | Knitter CRUD |
| `DyersModule` | `/dyers` | Dyer CRUD |
| `CompactersModule` | `/compacters` | Compacter CRUD |
| `ColoursModule` | `/colours` | Colour master data |
| `PurchaseOrdersModule` | `/purchase-orders` | Yarn & Fabric PO creation + listing |
| `YarnInwardModule` | `/yarn-inward` | Yarn receipt tracking (PENDING -> RECEIVED) |
| `YarnLotsModule` | `/yarn-lots` | Yarn lot inventory |
| `KnitterStockModule` | `/knitter-stock` | Per-knitter yarn stock ledger |
| `KnitterProgramsModule` | `/knitter-programs` | Knitting programme records |
| `KnittingsModule` | `/knittings` | Knitting job tracking |
| `KnittingLotsModule` | `/knitting-lots` | Knitting lot management |
| `KnittingModule` | *(no HTTP)* | Internal knitting helper service — no controller, service-only |
| `DeliveryNotesModule` | `/delivery-notes` | DC (Delivery Challan) records |
| `MemosModule` | `/memos` | Dyeing dispatch memos |
| `DyeingsModule` | `/dyeings` | Dyeing job records |
| `DyeingOrdersModule` | `/dyeing-orders` | Dyeing order management |
| `DyeingProgramsModule` | `/dyeing-programs` | Dyeing programme records |
| `DyeingDispatchModule` | `/dyeing-dispatch` | Dispatch tracking |
| `CompactingsModule` | `/compactings` | Compacting records — uses Zod validation + two-phase lifecycle (PENDING -> COMPLETED) |
| `InhouseKnittedFabricsModule` | `/inhouse-knitted-fabrics` | In-house fabric lots |
| `GreyFabricLotsModule` | `/grey-fabric-lots` | Grey fabric lot management |
| `GreyFabricInwardModule` | `/grey-fabric-inward` | External grey fabric purchases |
| `InventoryModule` | `/inventory` | Ledger + movement posting |
| `LotTrackerModule` | `/lot-tracker` | Cross-stage lot status tracking |
| `WorkflowModule` | `/workflow` | Status transition events |
| `ProductionPlanningModule` | `/production-planning` | Production plans + events |
| `AuditLogsModule` | `/audit-logs` | DB change audit trail |
| `AuthModule` | `/auth` | Supabase JWT auth — **globally enforced** |
| `ActivityLogsModule` | `/activity-logs` | Business event log — bulk import, summary stats, paginated list |

> **Note:** `YarnReceiptsModule` referenced in old docs no longer exists as a separate module. Its functionality was merged into `YarnInwardModule`.

### Cross-Cutting Concerns
- **`AllExceptionsFilter`** — global exception filter at `src/common/filters/all-exceptions.filter.ts`
- **`LoggerMiddleware`** — logs every request at `src/common/middleware/logger.middleware.ts`
- **`InventoryService.postInventoryMovement()`** — used by YarnInward, PurchaseOrders, Compactings to write to `InventoryLedger`
- **`/health`** endpoint — raw Express route registered in `main.ts`; NestJS guard does NOT run on it. Returns `{ status: 'ok', timestamp }`. Used by Render and `ServerWakeupBanner`.
- **CORS** — allows `http://localhost:3000`, `https://fabric-flow-frontend-1uju.onrender.com`, and `FRONTEND_URL` env var
- **`ActivityLogsService.log()`** — fire-and-forget live logger injected into 7 business service classes. Call with `void this.activityLogger.log({user, action, module, details})`. Never throws; errors are swallowed and logged to NestJS Logger only.
- **`ZodValidationPipe`** — at `src/common/pipes/zod-validation.pipe.ts`. Used on newer controllers (e.g. `CompactingsController`) as an alternative to `class-validator`. Uses Zod schemas exported from `@textile-flow/shared`.
- **`resolveUser(req)`** — helper at `src/common/types/authenticated-request.ts`. Returns `req.user?.email ?? req.user?.id ?? 'system'`. Used in all controllers to pass caller identity to service methods for activity logging.

### Validation Strategy (Dual)
The codebase has **two co-existing validation approaches**:

| Approach | Used By | How |
|----------|---------|-----|
| `class-validator` + `class-transformer` | Most modules (PO, YarnInward, etc.) | DTO class + `@UsePipes(new ValidationPipe(...))` |
| **Zod** (`ZodValidationPipe`) | Newer modules (Compactings) | `@Body(new ZodValidationPipe(Schema)) dto: InferredType` |

New modules should prefer the Zod approach since schemas live in `@textile-flow/shared` and are shared between frontend and backend.

---

## 4. Frontend — `apps/frontend`

### Stack
| Layer | Tech |
|-------|------|
| Framework | **Next.js 14** (App Router) |
| Styling | **Tailwind CSS** |
| Component Library | **shadcn/ui** (Radix primitives) |
| HTTP Client | **axios** (configured in `lib/api.ts`) |
| Server State | **@tanstack/react-query v5** |
| Forms | **react-hook-form** + `useFieldArray` |
| Toasts | **sonner** |
| PDF Generation | **html2pdf.js** (client-side capture of hidden HTML templates) |
| Auth | **Supabase JS client** (`@supabase/supabase-js`) |
| Deployment | Static SPA export (`next export` -> `out/`) on Render |
| PWA | Service worker (`/sw.js`) + Web App Manifest (`/manifest.json`) |

### Environment Variables (frontend — `apps/frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001      # points to backend; in prod: https://textile-flow-svc.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://nvtyytyykdjhgtinhftd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key-from-supabase-dashboard
```

### API Clients (`apps/frontend/lib/`)

The frontend uses **two HTTP clients** for different purposes:

```typescript
// 1. lib/api.ts — axios instance (used for mutations / most pages)
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000, // 30s — tolerates Render cold starts
});
// Request interceptor: auto-attaches Supabase JWT Bearer token on every request
// Response interceptor: on 401 -> signs out (signOutFromSupabase()) then redirects to /login
//                       on other errors -> logs method + URL + status
export default api;

// 2. lib/api/client.ts — fetch-based apiClient (used by Analytics page queries)
export async function apiClient<T>(endpoint: string, options?: RequestOptions): Promise<T>
// Returns T directly (not AxiosResponse). Accepts { params: Record<string, Primitive> }
// for GET query string building. Used in useQuery queryFn callbacks.
// Same Bearer token injection + 401 redirect behaviour as axios client.
```

**Rule:** New pages/components should use `api` (axios) for mutations and can use either for queries. The analytics page uses `apiClient` for reads and `api` for the bulk-import POST.

### App Router Structure
```text
apps/frontend/app/
├── (app)/                          <- Authenticated shell layout (ProtectedRoute + AppShell)
│   ├── layout.tsx                  <- Thin layout wrapper (193 bytes — just passes children)
│   ├── page.tsx                    <- Dashboard (home) — KPI cards, recent activity
│   ├── analytics/                  <- Activity Analytics page
│   │   └── page.tsx                <- xlsx/csv import, stat cards, recharts charts, log table
│   ├── audit/                      <- Audit log viewer
│   ├── master-data/                <- Master data management page
│   ├── production-planning/        <- Production planning section
│   │   ├── layout.tsx              <- Planning layout wrapper
│   │   ├── page.tsx                <- Production Plans list + creation
│   │   ├── dashboard/              <- Plan Dashboard view
│   │   └── events/                 <- Event Timeline view
│   └── tracker/                    <- Main operational section
│       ├── layout.tsx              <- Tracker layout wrapper
│       ├── page.tsx                <- Tracker landing
│       ├── purchase-orders/        <- PO creation + print + history
│       ├── yarn-inward/            <- Yarn inward tracking
│       ├── yarn/                   <- Yarn inventory (lots, by-knitter view)
│       ├── grey-fabric-inward/     <- External grey fabric purchases
│       ├── knitter-programs/       <- Knitting programme records
│       ├── dyeing/                 <- Dyeing dispatch records
│       ├── compactor/              <- Compacting records
│       ├── memos/                  <- Dyeing dispatch memos
│       ├── delivery-notes/         <- Delivery challan records
│       └── master-data/            <- Master data sub-route (mills, knitters, dyers, compacters, colours)
├── login/                          <- Login page (Supabase email/password — no hardcoded credentials)
├── error.tsx                       <- Global error boundary
├── not-found.tsx                   <- 404 page
├── globals.css                     <- Global Tailwind + base styles
└── layout.tsx                      <- Root layout — Geist font, QueryProvider, Toaster, ServerWakeupBanner, SW registration
```

### Auth Flow
- All `(app)/` routes are protected by `<ProtectedRoute>` which calls `getSupabaseSession()` and redirects to `/login` on no session.
- Subscribes to `onAuthStateChange` for reactive sign-out detection.
- Login page: `app/login/page.tsx` — standard email/password form, no hardcoded credentials. Users managed in Supabase Dashboard.
- **Backend auth is globally enforced** via `APP_GUARD` -> `JwtAuthGuard`.

### Key Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `AppShell` | `components/layout/AppShell.tsx` | Sidebar + mobile hamburger layout wrapper |
| `AppSidebar` | `components/layout/AppSidebar.tsx` | Navigation sidebar — shows user email, logout button |
| `ServerWakeupBanner` | `components/ui/server-wakeup-banner.tsx` | Pings `/health` on mount; shows "Waking up server..." pill if response takes >3s; auto-hides when ready |
| `PurchaseOrderForm` | `components/purchase-orders/PurchaseOrderForm.tsx` | Create YARN or GREY_FABRIC POs; includes supplier dropdown (mills + knitters), PDF preview |
| `PurchaseOrderPrintTemplate` | `components/purchase-orders/PurchaseOrderPrintTemplate.tsx` | Hidden A4 HTML template captured by html2pdf |
| `YarnPOPrint` | `components/po/YarnPOPrint.tsx` | Yarn-specific PO print layout |
| `YarnPOPreviewModal` | `components/po/YarnPOPreviewModal.tsx` | Preview before printing |
| `ProtectedRoute` | `components/auth/protected-route.tsx` | Auth gate HOC |

### Navigation Structure (AppSidebar)
```
Overview
  └─ Dashboard (/)

Master Data
  ├─ Mills              (/tracker/master-data/mills)
  ├─ Knitters           (/tracker/master-data/knitters)
  ├─ Dyers              (/tracker/master-data/dyers)
  ├─ Compacters         (/tracker/master-data/compacters)
  └─ Colours            (/tracker/master-data/colours)

Procurement
  ├─ Yarn Inward        (/tracker/yarn-inward)
  ├─ Yarn Inventory     (/tracker/yarn)
  ├─ Fabric Inventory   (/tracker/grey-fabric-inward)
  └─ Purchase Orders    (/tracker/purchase-orders)

Production
  ├─ Knitter Programs   (/tracker/knitter-programs)
  ├─ Dyeing Dispatch    (/tracker/dyeing)
  ├─ Memos              (/tracker/memos)
  ├─ Delivery Notes     (/tracker/delivery-notes)
  └─ Compactor          (/tracker/compactor)

Planning
  ├─ Production Plans   (/production-planning)
  ├─ Plan Dashboard     (/production-planning/dashboard)
  └─ Event Timeline     (/production-planning/events)

Analytics
  └─ Activity Analytics (/analytics)
```

---

## 5. Database Schema Summary

**Database:** Supabase PostgreSQL. Prisma schema at `apps/textile-flow-svc/prisma/schema.prisma`.

### Core Entity Relationships

```
Mill ──────────────────────────────┐
                                   ↓
PurchaseOrder ──→ YarnInward ──→ YarnLot ──→ KnitterStock
                       ↑               ↓
Knitter ───────────────┘         KnitterProgram ──→ GreyFabricLot
                                                         ↓
                                              Memo ──→ MemoLine ──→ Dyeing
                                                                      ↓
                                                               Compacting
```

### Key Models

| Model | PK Type | Key Fields | Notes |
|-------|---------|------------|-------|
| `Mill` | `Int` autoincrement | name, gstin, address fields | Yarn suppliers |
| `Knitter` | `Int` autoincrement | name, gstin, address fields | Knitting contractors |
| `Dyer` | `Int` autoincrement | name, gstin | Dyeing contractors |
| `Compacter` | `Int` autoincrement | name, gstin | Compacting contractors |
| `Colour` | `Int` autoincrement | name, code (unique), hexCode | Colour master |
| `PurchaseOrder` | **`String` cuid()** | poNumber, hfCode, supplierName, supplierAddress, supplierGST, date, deliveryDate, poType (YARN/GREY_FABRIC), deliveryName/Address/GST, fabric fields | Has `yarnInwards[]` and `items[]` |
| `PurchaseOrderItem` | `String` cuid() | Belongs to PO via cascading delete; bags, bagWeight, totalWeight, rate, cgst, sgst, count, quality | |
| `YarnInward` | `Int` autoincrement | status (PENDING/RECEIVED), millId, deliveryKnitterId, hfBatch, numBags, bagWeight, totalWeight, ratePerKg, cgstRate, sgstRate, purchaseOrderId? | Auto-created when PO saved; transitions PENDING->RECEIVED when yarn physically arrives |
| `YarnLot` | `Int` autoincrement | hfCode, millId, totalWeight, availableWeight, ratePerKg, status (ACTIVE/etc) | Created when YarnInward is RECEIVED |
| `KnitterStock` | `Int` autoincrement | knitterId, yarnLotId (composite unique), receivedWeight, remainingWeight | Updated via upsert when yarn delivered |
| `KnitterProgram` | `Int` autoincrement | knitterId, yarnLotId, quantityUsed, greyWeight, numRolls, programDate | Knitting production records |
| `GreyFabricLot` | `Int` autoincrement | lotNumber (unique), source (KNITTED/PURCHASED), status (AVAILABLE/DISPATCHED/CONSUMED/DELETED) | Source of truth for grey fabric |
| `Memo` | `Int` autoincrement | memoNo (sequential unique), dyerId, lines[] | Dispatch memo to dyer |
| `MemoLine` | `Int` autoincrement | memoId, greyFabricLotId?, sentWeight | One line per fabric lot sent |
| `Dyeing` | `Int` autoincrement | lotNo (unique), memoLineId (unique), dyerId, colourId, initialWeight, finalWeight, status | Return from dyer |
| `Compacting` | `Int` autoincrement | lotNo (unique), dyeingId, compacterId, finalWeight, processLoss, status (PENDING/COMPLETED) | Final stage — two-phase lifecycle |
| `InventoryLedger` | `Int` autoincrement | entityType, entityId, itemType, inwardWeight, outwardWeight, balanceWeight, stage | Running ledger; append-only |
| `LotTracker` | `Int` autoincrement | lotNo (unique), currentStatus, activeStage, completionPercent | Cross-stage tracker |
| `ProductionPlan` | `Int` autoincrement | planNo (unique), lotNo, stage, priority (LOW/NORMAL/HIGH/URGENT), status (PENDING/IN_PROGRESS/COMPLETED/CANCELLED) | |
| `AuditLog` | `Int` autoincrement | tableName, recordId, action (CREATE/UPDATE/DELETE), oldData, newData, performedBy | |
| `ActivityLog` | `Int` autoincrement | date, user, action, module, details?, source (IMPORT/LIVE), createdAt | Business event log; @@unique([date,user,action,module]) dedup constraint |

---

## 6. Critical Business Logic

### Purchase Order -> Auto-Inward Flow

When a **YARN PO** is saved (`POST /purchase-orders`), the service:
1. Creates the `PurchaseOrder` record with all `PurchaseOrderItem` rows in a single `$transaction`
2. Resolves the `Mill`:
   - **First:** tries `millId` if provided in DTO (sent by the frontend dropdown)
   - **Fallback:** fuzzy `ILIKE` on `supplierName`
3. Resolves the `Knitter`:
   - **First:** tries `knitterId` if provided in DTO
   - **Fallback:** fuzzy `ILIKE` on `deliveryName`
4. If both resolve -> creates a `YarnInward` row with `status: 'PENDING'`
5. If either fails -> attaches `inwardLinkWarning: string` to the response (non-fatal; PO still saves)
6. Returns `{ ...po, inwardLinkWarning }` — the frontend checks for this and shows a yellow toast

### YarnInward Status Lifecycle

```
PENDING -> RECEIVED
```
- Starts at `PENDING` (created automatically from PO, or manually created)
- Transitions to `RECEIVED` when the Yarn Inward edit dialog is opened and `receivedWeight` is submitted
- On transition to RECEIVED: creates `YarnLot`, upserts `KnitterStock`, posts `InventoryLedger` movement

### Compacting Two-Phase Lifecycle

```
PENDING -> COMPLETED
```
- `POST /compactings` -> creates record with `status: PENDING`. Logs workflow event. Posts an *outward* InventoryLedger entry (dyed fabric going in for compacting).
- `PATCH /compactings/:id` -> calls `completeCompacting()`. Sets `status: COMPLETED`. Calculates `processLoss = greyWeight - finalWeight` (**from original grey weight, NOT dyed weight**). Posts *inward* (compact fabric) + *loss* InventoryLedger entries. Evaluates `LotTracker`.
- `update()` is deprecated but kept for backwards compatibility; it delegates to `completeCompacting()`.

### PDF Generation — Known Quirk

The frontend generates PO PDFs by:
1. Rendering hidden `<div id="po-pdf-overlay-{id}">` HTML templates in the DOM (below the PO list)
2. After save + `refetchQueries`, doing a **double `requestAnimationFrame`** wait for React to paint
3. Then calling `generatePOPDF(elementId, poNumber)` from `lib/generatePdf.ts`

**Do not remove the double-rAF.** Single rAF causes a race condition where `html2pdf` can't find the element.

---

## 7. Deployment (Render.com)

### `render.yaml` — Current Config

**Backend service** (`textile-flow-svc`):
```yaml
buildCommand: npm install && npx prisma generate --schema=apps/textile-flow-svc/prisma/schema.prisma && npx turbo run build --filter=textile-flow-svc
startCommand: node apps/textile-flow-svc/dist/main.js
healthCheckPath: /health
region: singapore
plan: free
```

**Frontend service** (`fabric-flow-frontend`):
```yaml
buildCommand: npm install && npx turbo run build --filter=@textile-flow/frontend
staticPublishPath: apps/frontend/out
# SPA fallback: all routes -> /index.html
```

### Shared Environment Variable Group (`fabric-flow-secrets`)
```
DATABASE_URL         - Supabase connection string (pooled, PgBouncer)
DIRECT_URL           - Supabase direct connection (for migrations)
SUPABASE_URL         - https://nvtyytyykdjhgtinhftd.supabase.co
SUPABASE_JWT_SECRET  - For verifying Supabase JWTs in backend
NEXT_PUBLIC_API_URL  - https://textile-flow-svc.onrender.com (backend public URL)
NEXT_PUBLIC_SUPABASE_URL - (same as SUPABASE_URL)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY - Supabase anon key
FRONTEND_URL         - Render frontend URL (added to CORS allowlist)
```

### Cold Start Behaviour
Render free tier goes to sleep after 15 min. First request on cold start takes 20-30s. Frontend axios has `timeout: 30000` to handle this. Do not reduce below 30s.

The `ServerWakeupBanner` component pings `/health` on mount and shows a "Waking up server..." pill if the response takes >3s, then auto-hides when the server responds.

---

## 8. Known Bugs & Active TODOs

### Fixed (initial session)
- [x] **Auto-inward broken after render.yaml update**: Fixed by adding `millId`/`knitterId` to DTO and PO form; now uses ID-first resolution
- [x] **False "Save Failed" error toast**: Fixed by double-rAF before PDF generation
- [x] **Axios timeout missing**: Added 30s timeout
- [x] **render.yaml missing explicit `prisma generate`**: Fixed

### Fixed (Analytics session — 2026-07-09)
- [x] **Analytics dashboard built**: xlsx/csv import, 4 stat cards, 2 recharts bar charts (Events by Day, Events by Module), paginated + filterable log table — all at `/analytics`
- [x] **Live activity logging wired** into 7 modules (15 action points). `ActivityLogsService.log()` is fire-and-forget; never blocks business transactions
- [x] **TS error TS2322** in analytics page: `labelFormatter` recharts overload mismatch — fixed by wrapping as `(label: unknown) => formatDay(String(label))`
- [x] **TS error TS2345** in analytics page: shadcn `Select.onValueChange` can return `string | null` — fixed with `v ?? 'ALL'` guard

### Fixed (Local Setup session — 2026-08-18)
- [x] **Backend `.env` had stale credentials**: `apps/textile-flow-svc/.env` had an outdated password (`Fabric-Flow-db-pass-2026!`) and wrong `DIRECT_URL` host. Synced to match root `.env` (password: `Anushka1326`, correct Supabase pooler + direct hosts).
- [x] **Frontend `.env.local` was missing entirely**: Created `apps/frontend/.env.local` with all three required `NEXT_PUBLIC_*` variables.
- [x] **Prisma client not generated**: Ran `npx prisma generate` from repo root to regenerate the client after `npm install`.

### Fixed (Auth cleanup — 2026-08-21)
- [x] **Hardcoded test credentials removed**: Removed the `handleQuickSignIn` function and "Quick Sign-in" button from `app/login/page.tsx` that had `testadmin@fabricflow.app` / `FabricFlow2024!` committed to source. Login now uses the standard email/password form only.

### Fixed (Auth restore — 2026-08-21, commit `79d9929`)
- [x] **Auth now globally enforced**: `JwtAuthGuard` registered as `APP_GUARD` in `app.module.ts`. All routes require a valid Supabase JWT unless decorated with `@Public()`.
- [x] **Real user in activity logs**: `resolveUser(req)` wired in `yarn-inward`, `purchase-orders`, `memos`, `knitter-programs`, `dyeings`, `compactings` controllers. Logs now record authenticated user's email (falls back to user ID -> `'system'`).
- [x] **ProtectedRoute fully implemented**: Checks `getSupabaseSession()`, subscribes to `onAuthStateChange`, redirects to `/login` on no session.
- [x] **401 auto-redirect**: Both `lib/api.ts` (axios) and `lib/api/client.ts` (fetch) call `signOutFromSupabase()` then `window.location.replace('/login')` on 401 responses.

### Fixed (Auth navigation & Audit log fixes — 2026-08-22)
- [x] **ProtectedRoute redirect race condition on navigation**: `subscribeToAuthChanges` ignored `INITIAL_SESSION` event so rehydration delays do not trigger a false redirect to `/login`.
- [x] **ProtectedRoute consolidated into layout**: Moved `<ProtectedRoute>` into `apps/frontend/app/(app)/layout.tsx` wrapping `<AppShell>`, eliminating per-page duplication across 14 pages and `MasterDataEntityPage`.
- [x] **Compacting `performedBy` in AuditLog resolved**: `compactings.service.ts` `create()` now records `performingUser` (resolved from `resolveUser(req)` in the controller) instead of hardcoded `'system'`.
- [x] **Redirect-stub pages normalized**: Verified `/master-data`, `/tracker`, and `/tracker/master-data` are protected by `(app)/layout.tsx` before server redirect executes.

### Outstanding / Known Issues
- [!] **18 orphaned historical POs** (created before the fix): their `deliveryName` is `"CHHAVI NEETU TEXTILES LLP"` — this name does not exist as a Knitter in the DB, so the backfill script skipped them. To fix: either add that Knitter to the DB or update the POs' `deliveryName`.
- [!] **`selectedKnitterId` tracking on PO form**: The delivery address section uses a free-text input, not a knitter dropdown. So `knitterId` is always `null` from the PO form — the fuzzy `deliveryName` fallback applies. For reliable auto-inward: (a) add a knitter dropdown to the delivery section, or (b) ensure `deliveryName` exactly matches a `Knitter.name` in DB.
- [!] **Network: PostgreSQL ports 5432 & 6543 may be blocked**: On some home/office networks, outbound TCP to these ports is blocked. Supabase HTTPS (port 443) is always reachable. **Workaround:** switch to mobile hotspot or connect via VPN before running locally. See Section 14 for full diagnosis.

---

## 9. Running Locally

> **NETWORK PREREQUISITE:** PostgreSQL ports 5432 and 6543 must be open on your network.
> If you are on a home Wi-Fi or corporate network that blocks these ports, use a **mobile hotspot** or **VPN** before running. See Section 14 for full diagnosis.

```bash
# 1. Install all dependencies from the repo root (npm workspaces install everything)
cd Fabric-Flow-new
npm install

# 2. Set up backend environment
# File: apps/textile-flow-svc/.env  (already committed — verify credentials are current)
# Required keys:
#   DATABASE_URL  — Supabase pooler connection string (pgbouncer=true, port 6543)
#   DIRECT_URL    — Supabase direct connection (port 5432, used only by prisma migrate)
#   SUPABASE_URL  — https://nvtyytyykdjhgtinhftd.supabase.co
#   SUPABASE_JWT_SECRET — from Supabase dashboard -> Project Settings -> API

# 3. Set up frontend environment
# Create: apps/frontend/.env.local  (git-ignored — must be created manually each clone)
# NEXT_PUBLIC_API_URL=http://localhost:3001
# NEXT_PUBLIC_SUPABASE_URL=https://nvtyytyykdjhgtinhftd.supabase.co
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
# Get the anon key from: Supabase Dashboard -> Project Settings -> API -> anon/public key

# 4. Generate the Prisma client (required after every fresh npm install)
npx prisma generate --schema=apps/textile-flow-svc/prisma/schema.prisma

# 5. Start both services concurrently via Turborepo (from repo root)
npm run dev
# Backend  -> http://localhost:3001  (NestJS, compiles TypeScript in watch mode ~20s)
# Frontend -> http://localhost:3000  (Next.js, ready in ~15s)
# Shared   -> packages/shared rebuilt automatically on change
```

### Environment Variable Reference

**Backend** (`apps/textile-flow-svc/.env`):
```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-0-ap-northeast-1.supabase.com:5432/postgres"
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_JWT_SECRET=<jwt-secret-from-supabase-dashboard>
```

**Frontend** (`apps/frontend/.env.local` — **never committed, create manually**):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon-key-from-supabase-dashboard>
```

### Startup Verification Checklist
| Check | Expected |
|-------|----------|
| `GET http://localhost:3001/health` | `{"status":"ok","timestamp":"..."}` |
| `GET http://localhost:3001/mills` | **401 Unauthorized** (auth is now globally enforced — use a valid JWT) |
| `http://localhost:3000` | Login page (if no session) or Dashboard |
| NestJS log | `Database connection established.` printed on startup |

> **Important:** `GET /mills` now returns 401 without a Bearer token. This is expected and correct — auth is enforced globally. To test the API directly, get a JWT from Supabase Dashboard -> Authentication -> Users -> Generate JWT.

---

## 10. Running the Backfill Script

For any historical Yarn POs missing a linked `YarnInward`:

```bash
cd apps/textile-flow-svc
../../node_modules/.bin/ts-node \
  -P tsconfig.json \
  -r tsconfig-paths/register \
  scripts/backfill-yarn-inward.ts
```

Safe to re-run (idempotent). Skips POs already having an inward row.

---

## 11. Conventions & Patterns

### Backend
- Every module follows NestJS standard: `module.ts`, `controller.ts`, `service.ts`, optional `dto/` folder
- **Validation:** Use `ZodValidationPipe` (from `src/common/pipes/zod-validation.pipe.ts`) with schemas from `@textile-flow/shared` for new modules. Legacy modules use `class-validator` DTOs — don't mix strategies in the same module.
- **User identity:** Always accept `performingUser = 'system'` as a service method parameter. Controllers pass `resolveUser(req)`. Never hardcode `'system'` in service methods that have a real user context.
- All DB-mutating operations that touch multiple tables **must** use `prisma.$transaction(async (tx) => {...})`
- Inventory movements always go through `InventoryService.postInventoryMovement()` within the same transaction
- Audit log entries are written inline within transactions where needed
- Activity logging is always **outside** the transaction (fire-and-forget after `.then()`)

### Frontend
- All API calls via the shared `api` axios instance from `lib/api.ts`
- Server state via React Query; key pattern: `['resource-name']` or `['resource-name', id]`
- Toast notifications via `sonner`: `toast.success()`, `toast.error()`, `toast.warning()` (8s duration for warnings)
- Forms: `react-hook-form` with `useFieldArray` for dynamic rows
- Protected pages always wrap content in `<ProtectedRoute>`
- Shadcn components are in `components/ui/`

### TypeScript
- `strict: true` equivalent (strictNullChecks, noImplicitAny, etc.) on backend
- Frontend uses Next.js default tsconfig
- Shared types/DTOs/Zod schemas live in `packages/shared/src/`

---

## 12. File Quick Reference

| What you're looking for | File |
|------------------------|------|
| Database schema | `apps/textile-flow-svc/prisma/schema.prisma` |
| Backend entry point | `apps/textile-flow-svc/src/main.ts` |
| NestJS module registry | `apps/textile-flow-svc/src/app.module.ts` |
| PO creation logic (auto-inward) | `apps/textile-flow-svc/src/purchase-orders/purchase-orders.service.ts` |
| PO DTO | `apps/textile-flow-svc/src/purchase-orders/dto/create-purchase-order.dto.ts` |
| Yarn Inward service | `apps/textile-flow-svc/src/yarn-inward/yarn-inward.service.ts` |
| Inventory service | `apps/textile-flow-svc/src/inventory/inventory.service.ts` |
| Prisma service (DB client) | `apps/textile-flow-svc/src/prisma/prisma.service.ts` |
| Auth guard | `apps/textile-flow-svc/src/auth/jwt-auth.guard.ts` |
| Public decorator | `apps/textile-flow-svc/src/auth/public.decorator.ts` |
| AuthenticatedRequest type + resolveUser() | `apps/textile-flow-svc/src/common/types/authenticated-request.ts` |
| Zod validation pipe | `apps/textile-flow-svc/src/common/pipes/zod-validation.pipe.ts` |
| Compacting service (two-phase lifecycle) | `apps/textile-flow-svc/src/compactings/compactings.service.ts` |
| Frontend axios client | `apps/frontend/lib/api.ts` |
| Frontend fetch client | `apps/frontend/lib/api/client.ts` |
| Auth helpers (Supabase) | `apps/frontend/lib/auth.ts` |
| PO form component | `apps/frontend/components/purchase-orders/PurchaseOrderForm.tsx` |
| App shell (sidebar + mobile) | `apps/frontend/components/layout/AppShell.tsx` |
| Sidebar navigation | `apps/frontend/components/layout/AppSidebar.tsx` |
| Server wakeup banner | `apps/frontend/components/ui/server-wakeup-banner.tsx` |
| Protected route guard | `apps/frontend/components/auth/protected-route.tsx` |
| Root layout (providers, PWA SW) | `apps/frontend/app/layout.tsx` |
| Login page | `apps/frontend/app/login/page.tsx` |
| Yarn Inward page | `apps/frontend/app/(app)/tracker/yarn-inward/page.tsx` |
| Analytics page | `apps/frontend/app/(app)/analytics/page.tsx` |
| Production planning page | `apps/frontend/app/(app)/production-planning/page.tsx` |
| Activity log service (backend) | `apps/textile-flow-svc/src/activity-logs/activity-logs.service.ts` |
| Activity log controller | `apps/textile-flow-svc/src/activity-logs/activity-logs.controller.ts` |
| PO types | `apps/frontend/types/purchase-order.ts` |
| Entity types | `apps/frontend/types/entities.ts` |
| Shared package exports | `packages/shared/src/index.ts` |
| PWA manifest | `apps/frontend/public/manifest.json` |
| Service worker | `apps/frontend/public/sw.js` |
| Deployment config | `render.yaml` |
| Backfill script | `apps/textile-flow-svc/scripts/backfill-yarn-inward.ts` |

---

## 13. Analytics System

### Architecture
The Analytics Dashboard (`/analytics`) has two data sources:

| Source | Value | How set |
|--------|-------|--------|
| `IMPORT` | Historical logs loaded from `.xlsx`/`.csv` | User drags file -> frontend parses with `xlsx` library -> `POST /activity-logs/bulk-import` |
| `LIVE` | Real-time logs from actual app usage | `ActivityLogsService.log()` called inside service methods after successful operations |

### Backend Endpoints (`/activity-logs`)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/bulk-import` | Insert rows from Excel. Body: `{ logs: [{date, user, action, module, details?, source}] }`. Skips duplicates via `@@unique([date,user,action,module])`. |
| `GET` | `/summary` | Returns `{ totalEvents, uniqueUsers[], activeDays, eventsByModule[], eventsByUser[], eventsByDay[], recentLogs[] }`. Accepts `?from=&to=` date filters. |
| `GET` | `/` | Paginated log list. Accepts `?page=&user=&module=&from=&to=`. Returns `{ data[], total, page, pageSize }`. |

### Live Logging — 15 Instrumented Actions

| Module | Actions |
|--------|---------|
| Purchase Orders | PO Created, PO Updated, PO Cancelled |
| Yarn Inward | Yarn Inward Created, Yarn Received, Yarn Inward Deleted |
| Knitter Programs | Knitter Program Created, Knitter Program Deleted |
| Memos | Dyeing Memo Created (includes lot numbers in `details`) |
| Dyeings | Dyeing Return Recorded, Dyeing Updated |
| Compactings | Compacting Created, Compacting Completed |

### Live Logging Pattern
```typescript
// In any service that imports ActivityLogsService:
void this.activityLogger.log({
  user: performingUser,  // passed from controller via resolveUser(req) — records real user email
  action: 'PO Created',
  module: 'Purchase Orders',
  details: 'PO-2025-001 | YARN | Supplier: ABC Mills',
});
// MUST use void — never await. Swallows errors silently.
```

**To add logging to a new module:**
1. Import `ActivityLogsModule` in the feature module
2. Inject `ActivityLogsService` into the feature service constructor
3. Accept `performingUser = 'system'` in service methods
4. Pass `resolveUser(req)` from the controller
5. Call `void this.activityLogger.log(...)` after the primary operation succeeds

### Frontend Stack for Analytics
- **xlsx** library: parses `.xlsx`, `.xls`, `.csv` in-browser via `FileReader` + `Uint8Array`
- **recharts**: `BarChart` (Events by Day) + horizontal `BarChart` with `Cell` colors (Events by Module)
- **`apiClient`** (fetch-based, `lib/api/client.ts`): used in `useQuery` queryFn for summary and log list
- **`api`** (axios, `lib/api.ts`): used for the `POST /bulk-import` mutation

---

## 14. Local Setup & Environment Notes (2026-08-18)

> Context: First full local run of the project after initial deployment on Render. Documents what was discovered, what was fixed, and known network gotchas.

### What Was Done

| Action | Detail |
|--------|--------|
| `npm install` | Run from repo root — installs all workspace packages. Removes/audits 1254 packages. |
| Prisma client generated | `npx prisma generate --schema=apps/textile-flow-svc/prisma/schema.prisma` |
| Backend `.env` fixed | Stale password `Fabric-Flow-db-pass-2026!` replaced with current `Anushka1326`; `DIRECT_URL` updated to correct direct host `aws-0-ap-northeast-1.supabase.com` |
| Frontend `.env.local` created | New file — was missing entirely on first clone. Contains the three `NEXT_PUBLIC_*` variables. |
| Both dev servers started | `npm run dev` from root -> Turborepo starts `@textile-flow/shared`, `@textile-flow/frontend`, `textile-flow-svc` concurrently |

### Confirmed Working
- [x] `http://localhost:3001/health` -> `{"status":"ok"}`
- [x] `http://localhost:3000` -> Next.js frontend loads (login page, then dashboard after auth)
- [x] Supabase HTTPS (port 443) -> reachable (auth, REST API)
- [x] NestJS TypeScript compilation -> 0 errors
- [x] Shared package (`@textile-flow/shared`) -> builds and watches correctly

### Database Network Connectivity Issue

**Symptom:** All Prisma DB queries fail with `ETIMEDOUT` immediately after query execution.

**Root Cause:** The Wi-Fi network/ISP blocks outbound TCP connections to non-HTTP ports. PostgreSQL runs on 5432 (direct) and 6543 (PgBouncer). Both are blocked at the router or ISP level.

**This is NOT a code or credentials bug.** The app, credentials, and DB schema are all correct.

**Workarounds (pick one):**
1. **Mobile hotspot** (fastest): Switch your Wi-Fi to a phone hotspot — mobile data doesn't block these ports
2. **VPN**: Cloudflare WARP (free), ProtonVPN (free tier), or any VPN that routes TCP traffic normally
3. **Router firewall**: Log in to `172.16.208.1` -> allow outbound TCP on ports 5432 and 6543
4. **ISP**: Contact your ISP to unblock outbound PostgreSQL connections

### Important: `.env.local` is Git-Ignored
`apps/frontend/.env.local` is listed in `.gitignore` and will **not** be present after a fresh `git clone`. It must be created manually every time. The three required values are:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://nvtyytyykdjhgtinhftd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<get from Supabase Dashboard -> Project Settings -> API -> anon/public>
```

---

## 15. GitHub CI & Linting Standards (2026-08-18)

### Repository URL
- **Canonical Repository:** https://github.com/AnushkaAnnie/Fabric-Flow-new
- **Default Branch:** `main`

### GitHub Actions CI Checks
The CI workflow runs on every push and pull request to `main`:
1. `npx turbo run lint` (runs ESLint across shared, frontend, and backend packages)
2. `npx turbo run build` (builds shared package, frontend Next.js static export, and NestJS service)

### Linting Rules & Critical Gotchas
| Area | Rule / Issue | Fix Applied |
|------|-------------|-------------|
| **Next.js ESLint** | `@next/next/no-assign-module-variable` | Never assign or declare a variable named `module` (e.g. in `analytics/page.tsx` normaliseHeaders). Use `moduleName` or `mod` instead because `module` is reserved as a CommonJS global. |
| **React Hooks** | `react-hooks/exhaustive-deps` | Helper functions invoked inside `useCallback` (e.g., `parseFile`) must be wrapped in `useCallback` and listed in the dependency array to ensure consistent closure state. |
| **TypeScript Unused Vars** | `@typescript-eslint/no-unused-vars` | Unused variables, imports, and interface declarations cause CI failures in strict mode. Remove unused types and destructured variables. |
| **Catch Blocks** | Unused error object | Use bare `try { ... } catch { ... }` or prefix with `_err` when the error object is not inspected in the logger/handler. |
| **Memo Line Mapping** | Sourced yarn lots | In `memos.service.ts`, ensure `hfCodes` is assigned to `hfCode` on returned memo line creation objects for multi-yarn program lots. |

### Verification Command
```bash
npx turbo run lint
# Expected: Tasks: 4 successful, 4 total (0 errors)
```

---

## 16. Authentication System

> **Status:** Fully active and globally enforced as of commit `79d9929` (2026-08-21).

### How It Works (End-to-End)

```
User visits protected page
        |
        v
ProtectedRoute (client-side)
  -> calls getSupabaseSession()
  -> if no session: router.replace('/login')
  -> subscribes to onAuthStateChange for reactive sign-out
        |
        v
Login Page (/login)
  -> calls signInWithSupabase(email, password)  [lib/auth.ts]
  -> Supabase JS creates session, stores in cookie
  -> on success: router.replace('/')
        |
        v
API calls (lib/api.ts / lib/api/client.ts)
  -> interceptor reads getSupabaseAccessToken()
  -> attaches Authorization: Bearer <JWT>
  -> on 401 response: signOutFromSupabase() then window.location.replace('/login')
        |
        v
NestJS Backend (JwtAuthGuard — global APP_GUARD)
  -> checks @Public() metadata first — if public, allow through
  -> reads Authorization: Bearer header
  -> verifies JWT via JWKS (RS256) or SUPABASE_JWT_SECRET (HS256)
  -> attaches req.user = { id, email, role } on success
  -> throws 401 UnauthorizedException on failure
        |
        v
Controller
  -> resolveUser(req) -> req.user?.email ?? req.user?.id ?? 'system'
  -> passes to service method as performingUser
  -> service uses for activity log + audit trail
```

### Backend Files

| File | Role |
|------|------|
| `src/auth/auth.service.ts` | Supabase JWT verification (RS256 JWKS + HS256 secret fallback) |
| `src/auth/jwt-auth.guard.ts` | Global NestJS guard — checks `@Public()`, extracts + verifies Bearer token |
| `src/auth/public.decorator.ts` | `@Public()` opt-out decorator |
| `src/auth/auth.controller.ts` | `GET /auth/me` — always `@Public()`, returns `{ user: null }` |
| `src/common/types/authenticated-request.ts` | Shared `AuthenticatedRequest` type + `resolveUser()` helper |
| `src/app.module.ts` | Registers `JwtAuthGuard` as `APP_GUARD` |

### Frontend Files

| File | Role |
|------|------|
| `lib/auth.ts` | Supabase client helpers: signIn, signOut, getSession, getAccessToken, subscribe |
| `lib/api.ts` | Axios instance — auto-attaches Bearer token; signs out + redirects to `/login` on 401 |
| `lib/api/client.ts` | Fetch-based client — same Bearer token + 401 redirect pattern |
| `app/login/page.tsx` | Login UI — email/password form only; no hardcoded credentials |
| `components/auth/protected-route.tsx` | Client-side route guard using `getSupabaseSession()` + `subscribeToAuthChanges()` |
| `components/layout/AppSidebar.tsx` | Logout -> `signOutFromSupabase()` -> redirect to `/login`; shows user email |

### Public Routes (Backend)

| Route | Why public |
|-------|-----------|
| `GET /` (AppController) | Has `@Public()` |
| `GET /health` | Raw Express route in `main.ts` — NestJS guard never runs on it |
| `GET /auth/me` | Has `@Public()` — always returns `{ user: null }` |

All other routes require a valid Supabase JWT Bearer token.

### User Management

Users are managed exclusively via the **Supabase Dashboard -> Authentication -> Users**. The app never stores passwords — Supabase handles all credential verification.

### Real User in Activity Logs

Activity logs now record the authenticated user's email via `resolveUser(req)` (falls back to user ID -> `'system'`). Wired in: `yarn-inward`, `purchase-orders`, `memos`, `knitter-programs`, `dyeings`, `compactings`.

### Static Export Constraint

`next.config.js` sets `output: 'export'`. **Next.js middleware does NOT run in production** (Render serves static files). All route protection is enforced **client-side** in `ProtectedRoute`.

### Required Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend `.env.local` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Frontend `.env.local` | Supabase anon key |
| `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` | Backend `.env` | Used to construct JWKS URL |
| `SUPABASE_JWT_SECRET` | Backend `.env` | Required for HS256 JWT verification |

---

## 17. PWA (Progressive Web App)

> **Status:** Installed as of commit `f29af8e`.

Fabric Flow is installable as a PWA on mobile and desktop browsers.

### Files
| File | Purpose |
|------|---------|
| `apps/frontend/public/manifest.json` | Web App Manifest — name, icons, theme, shortcuts, display mode |
| `apps/frontend/public/sw.js` | Service Worker — precaches shell, network-first for navigation, cache-first for static assets |
| `apps/frontend/public/icon-*.png` | Icons at 72, 96, 128, 144, 152, 192, 384, 512px |
| `apps/frontend/public/apple-touch-icon.png` | iOS home screen icon (180x180) |
| `apps/frontend/app/layout.tsx` | Registers SW via Script tag; sets theme color, viewport, apple-web-app metadata |

### Manifest Shortcuts
- **Tracker** -> `/tracker`
- **Purchase Orders** -> `/tracker/purchase-orders`

### Service Worker Strategy
- **Install:** Precaches `/`, `/manifest.json`, `/icon-192x192.png`, `/icon-512x512.png`
- **Navigation requests:** Network-first, fallback to cache (offline-capable shell)
- **Static assets:** Cache-first, then network
- **API calls / cross-origin:** Bypassed — goes directly to network (no caching of backend data)

### Cold Start UX: `ServerWakeupBanner`
Since Render free tier sleeps after 15min, `ServerWakeupBanner` (`components/ui/server-wakeup-banner.tsx`) provides a loading indicator:
- Mounted globally in `app/layout.tsx` (inside `QueryProvider`)
- Pings `GET /health` on mount with a 2-minute timeout
- If no response within 3s -> shows a glassmorphic pill: "Waking up server... (first load may take ~30s)"
- Once server responds -> shows "Server ready" for 2s, then disappears
