# Fabric Flow — Codebase Handoff Document

> **Purpose:** Complete context for any AI assistant (Claude, Gemini, etc.) to pick up and continue development on this project without needing to ask basic questions about the architecture, stack, or conventions.

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
Fabric-Flow-new-main/
├── apps/
│   ├── frontend/          ← Next.js 14 (App Router), deployed as static SPA on Render
│   └── textile-flow-svc/  ← NestJS REST API, deployed on Render (Node runtime)
├── packages/
│   ├── shared/            ← Shared DTOs and types (@textile-flow/shared)
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
| Auth | Supabase JWT verification (present in codebase, **not globally enforced** yet — JwtAuthGuard is built but commented out from APP_GUARD) |
| Validation | `class-validator` + `class-transformer` on all DTOs |
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
| `YarnInwardModule` | `/yarn-inward` | Yarn receipt tracking (PENDING → RECEIVED) |
| `YarnLotsModule` | `/yarn-lots` | Yarn lot inventory |
| `YarnReceiptsModule` | `/yarn-receipts` | Individual receipts per lot |
| `KnitterStockModule` | `/knitter-stock` | Per-knitter yarn stock ledger |
| `KnitterProgramsModule` | `/knitter-programs` | Knitting programme records |
| `KnittingsModule` | `/knittings` | Knitting job tracking |
| `KnittingLotsModule` | `/knitting-lots` | Knitting lot management |
| `DeliveryNotesModule` | `/delivery-notes` | DC (Delivery Challan) records |
| `MemosModule` | `/memos` | Dyeing dispatch memos |
| `DyeingsModule` | `/dyeings` | Dyeing job records |
| `DyeingOrdersModule` | `/dyeing-orders` | Dyeing order management |
| `DyeingProgramsModule` | `/dyeing-programs` | Dyeing programme records |
| `DyeingDispatchModule` | `/dyeing-dispatch` | Dispatch tracking |
| `CompactingsModule` | `/compactings` | Compacting records |
| `InhouseKnittedFabricsModule` | `/inhouse-knitted-fabrics` | In-house fabric lots |
| `GreyFabricLotsModule` | `/grey-fabric-lots` | Grey fabric lot management |
| `GreyFabricInwardModule` | `/grey-fabric-inward` | External grey fabric purchases |
| `InventoryModule` | `/inventory` | Ledger + movement posting |
| `LotTrackerModule` | `/lot-tracker` | Cross-stage lot status tracking |
| `WorkflowModule` | `/workflow` | Status transition events |
| `ProductionPlanningModule` | `/production-planning` | Production plans + events |
| `AuditLogsModule` | `/audit-logs` | DB change audit trail |
| `AuthModule` | `/auth` | Supabase JWT auth (not enforced globally yet) |
| `ActivityLogsModule` | `/activity-logs` | Business event log — bulk import, summary stats, paginated list |

### Cross-Cutting Concerns
- **`AllExceptionsFilter`** — global exception filter at `src/common/filters/all-exceptions.filter.ts`
- **`LoggerMiddleware`** — logs every request at `src/common/middleware/logger.middleware.ts`
- **`InventoryService.postInventoryMovement()`** — used by YarnInward and PurchaseOrders to write to `InventoryLedger`
- **`/health`** endpoint — returns `{ status: 'ok', timestamp }`, used by Render for health checks
- **CORS** — allows `http://localhost:3000`, `https://fabric-flow-frontend.onrender.com`, and `FRONTEND_URL` env var
- **`ActivityLogsService.log()`** — fire-and-forget live logger injected into 7 business service classes. Call with `void this.activityLogger.log({user, action, module, details})`. Never throws; errors are swallowed and logged to NestJS Logger only.

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
| Deployment | Static SPA export (`next export` → `out/`) on Render |

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
// Interceptor auto-attaches Supabase JWT Bearer token on every request
// Response interceptor logs errors with method + URL + status
export default api;

// 2. lib/api/client.ts — fetch-based apiClient (used by Analytics page queries)
export async function apiClient<T>(endpoint: string, options?: RequestOptions): Promise<T>
// Returns T directly (not AxiosResponse). Accepts { params: Record<string, Primitive> }
// for GET query string building. Used in useQuery queryFn callbacks.
```

**Rule:** New pages/components should use `api` (axios) for mutations and can use either for queries. The analytics page uses `apiClient` for reads and `api` for the bulk-import POST.

### App Router Structure
```text
apps/frontend/app/
├── (app)/                          ← Authenticated shell layout
│   ├── layout.tsx
│   ├── page.tsx                    ← Dashboard (home)
│   ├── analytics/                  ← Activity Analytics page (NEW)
│   │   └── page.tsx                ← xlsx/csv import, stat cards, recharts charts, log table
│   ├── master-data/                ← Master data management page
│   │   └── page.tsx
│   ├── production-planning/        ← Production planning view
│   ├── audit/                      ← Audit log viewer
│   └── tracker/                    ← Main operational section
│       ├── purchase-orders/        ← PO creation + print + history
│       ├── yarn-inward/            ← Yarn inward tracking
│       ├── yarn/                   ← Yarn inventory (lots, by-knitter view)
│       ├── grey-fabric-inward/     ← External grey fabric purchases
│       ├── knitter-programs/       ← Knitting programme records
│       ├── dyeing/                 ← Dyeing records
│       ├── compactor/              ← Compacting records
│       ├── memos/                  ← Dyeing dispatch memos
│       ├── delivery-notes/         ← Delivery challan records
│       └── master-data/            ← (redundant route, maps to master-data page)
├── auth/                           ← Login page (Supabase email/password)
└── layout.tsx                      ← Root layout with providers
```

### Auth Flow
- Protected by `<ProtectedRoute>` component which checks `supabase.auth.getUser()`
- Auth is **partially implemented** — login UI exists, JWT is attached to requests, but the backend's `JwtAuthGuard` is not registered globally (intentionally, to avoid breaking flows during development)
- Login page: `app/auth/`

### Key Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `PurchaseOrderForm` | `components/purchase-orders/PurchaseOrderForm.tsx` | Create YARN or GREY_FABRIC POs; includes supplier dropdown (mills + knitters), PDF preview |
| `PurchaseOrderPrintTemplate` | `components/purchase-orders/PurchaseOrderPrintTemplate.tsx` | Hidden A4 HTML template captured by html2pdf |
| `YarnPOPrint` | `components/po/YarnPOPrint.tsx` | Yarn-specific PO print layout |
| `YarnPOPreviewModal` | `components/po/YarnPOPreviewModal.tsx` | Preview before printing |
| `ProtectedRoute` | `components/auth/protected-route.tsx` | Auth gate HOC |

---

## 5. Database Schema Summary

**Database:** Supabase PostgreSQL. Prisma schema at `apps/textile-flow-svc/prisma/schema.prisma`.

### Core Entity Relationships

```text
Mill ──────────────────┐
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
| `PurchaseOrderItem` | `String` cuid() | Belongs to PO via cascading delete; bags, bagWeight, totalWeight, rate, cgst, sgst, count, quality |  |
| `YarnInward` | `Int` autoincrement | status (PENDING/RECEIVED), millId, deliveryKnitterId, hfBatch, numBags, bagWeight, totalWeight, ratePerKg, cgstRate, sgstRate, purchaseOrderId? | Auto-created when PO saved; transitions PENDING→RECEIVED when yarn physically arrives |
| `YarnLot` | `Int` autoincrement | hfCode, millId, totalWeight, availableWeight, ratePerKg, status (ACTIVE/etc) | Created when YarnInward is RECEIVED |
| `KnitterStock` | `Int` autoincrement | knitterId, yarnLotId (composite unique), receivedWeight, remainingWeight | Updated via upsert when yarn delivered |
| `KnitterProgram` | `Int` autoincrement | knitterId, yarnLotId, quantityUsed, greyWeight, numRolls, programDate | Knitting production records |
| `GreyFabricLot` | `Int` autoincrement | lotNumber (unique), source (KNITTED/PURCHASED), status (AVAILABLE/DISPATCHED/CONSUMED/DELETED) | Source of truth for grey fabric |
| `Memo` | `Int` autoincrement | memoNo (sequential unique), dyerId, lines[] | Dispatch memo to dyer |
| `MemoLine` | `Int` autoincrement | memoId, greyFabricLotId?, sentWeight | One line per fabric lot sent |
| `Dyeing` | `Int` autoincrement | lotNo (unique), memoLineId (unique), dyerId, colourId, initialWeight, finalWeight, status | Return from dyer |
| `Compacting` | `Int` autoincrement | lotNo (unique), dyeingId, compacterId, finalWeight | Final stage |
| `InventoryLedger` | `Int` autoincrement | entityType, entityId, itemType, inwardWeight, outwardWeight, balanceWeight, stage | Running ledger; append-only |
| `LotTracker` | `Int` autoincrement | lotNo (unique), currentStatus, activeStage, completionPercent | Cross-stage tracker |
| `ProductionPlan` | `Int` autoincrement | planNo (unique), lotNo, stage, priority (LOW/NORMAL/HIGH/URGENT), status (PENDING/IN_PROGRESS/COMPLETED/CANCELLED) | |
| `AuditLog` | `Int` autoincrement | tableName, recordId, action (CREATE/UPDATE/DELETE), oldData, newData, performedBy | |
| `ActivityLog` | `Int` autoincrement | date, user, action, module, details?, source (IMPORT\|LIVE), createdAt | Business event log; `@@unique([date,user,action,module])` dedup constraint |

---

## 6. Critical Business Logic

### Purchase Order → Auto-Inward Flow

When a **YARN PO** is saved (`POST /purchase-orders`), the service:
1. Creates the `PurchaseOrder` record with all `PurchaseOrderItem` rows in a single `$transaction`
2. Resolves the `Mill`:
   - **First:** tries `millId` if provided in DTO (sent by the frontend dropdown)
   - **Fallback:** fuzzy `ILIKE` on `supplierName`
3. Resolves the `Knitter`:
   - **First:** tries `knitterId` if provided in DTO
   - **Fallback:** fuzzy `ILIKE` on `deliveryName`
4. If both resolve → creates a `YarnInward` row with `status: 'PENDING'`
5. If either fails → attaches `inwardLinkWarning: string` to the response (non-fatal; PO still saves)
6. Returns `{ ...po, inwardLinkWarning }` — the frontend checks for this and shows a yellow toast

### YarnInward Status Lifecycle

```
PENDING → RECEIVED
```
- Starts at `PENDING` (created automatically from PO, or manually created)
- Transitions to `RECEIVED` when the Yarn Inward edit dialog is opened and `receivedWeight` is submitted
- On transition to RECEIVED: creates `YarnLot`, upserts `KnitterStock`, posts `InventoryLedger` movement

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
# SPA fallback: all routes → /index.html
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
```

### Cold Start Behaviour
Render free tier goes to sleep after 15 min. First request on cold start takes 20-30s. Frontend axios has `timeout: 30000` to handle this. Do not reduce below 30s.

---

## 8. Known Bugs & Active TODOs

### Fixed (initial session)
- ✅ **Auto-inward broken after render.yaml update**: Fixed by adding `millId`/`knitterId` to DTO and PO form; now uses ID-first resolution
- ✅ **False "Save Failed" error toast**: Fixed by double-rAF before PDF generation
- ✅ **Axios timeout missing**: Added 30s timeout
- ✅ **render.yaml missing explicit `prisma generate`**: Fixed

### Fixed (Analytics session — 2026-07-09)
- ✅ **Analytics dashboard built**: xlsx/csv import, 4 stat cards, 2 recharts bar charts (Events by Day, Events by Module), paginated + filterable log table — all at `/analytics`
- ✅ **Live activity logging wired** into 7 modules (15 action points). `ActivityLogsService.log()` is fire-and-forget; never blocks business transactions
- ✅ **TS error TS2322** in analytics page: `labelFormatter` recharts overload mismatch — fixed by wrapping as `(label: unknown) => formatDay(String(label))`
- ✅ **TS error TS2345** in analytics page: shadcn `Select.onValueChange` can return `string | null` — fixed with `v ?? 'ALL'` guard

### Fixed (Local Setup session — 2026-08-18)
- ✅ **Backend `.env` had stale credentials**: `apps/textile-flow-svc/.env` had an outdated password (`Fabric-Flow-db-pass-2026!`) and wrong `DIRECT_URL` host. Synced to match root `.env` (password: `Anushka1326`, correct Supabase pooler + direct hosts).
- ✅ **Frontend `.env.local` was missing entirely**: Created `apps/frontend/.env.local` with all three required `NEXT_PUBLIC_*` variables.
- ✅ **Prisma client not generated**: Ran `npx prisma generate` from repo root to regenerate the client after `npm install`.

### Outstanding / Known Issues
- ⚠️ **18 orphaned historical POs** (created before the fix): their `deliveryName` is `"CHHAVI NEETU TEXTILES LLP"` — this name does not exist as a Knitter in the DB, so the backfill script skipped them. To fix: either add that Knitter to the DB or update the POs' `deliveryName`.
- ⚠️ **Auth is not globally enforced**: `JwtAuthGuard` is coded but not applied as `APP_GUARD`. The `ProtectedRoute` on the frontend protects UI but the API is technically unauthenticated.
- ⚠️ **`selectedKnitterId` tracking**: The frontend tracks `selectedMillId` from supplier dropdown, but `selectedKnitterId` is tracked via state and reset, but the delivery dropdown does not yet emit knitter IDs directly (the delivery address field is a text input, not a knitter dropdown on the PO form). This means `knitterId` will always be `null` from the PO form — the fuzzy fallback on `deliveryName` applies. For the auto-inward to work reliably, either: (a) add a knitter dropdown to the delivery section of PO form, or (b) ensure the default `deliveryName` exactly matches a `Knitter.name` in DB.
- ⚠️ **ActivityLog user field is always `'system'`**: The live logger currently hardcodes `user: 'system'` since there is no authenticated user context in NestJS services yet. Once `JwtAuthGuard` is enforced globally, a request-scoped user context can be passed through to log the actual user.
- ⚠️ **Network: PostgreSQL ports 5432 & 6543 may be blocked**: On some home/office networks and ISPs (confirmed on this machine's Wi-Fi), outbound TCP to ports 5432 and 6543 is blocked at the router/ISP level. Supabase HTTPS (port 443) is always reachable. **Workaround:** switch to mobile hotspot or connect via VPN before running locally. See Section 14 for full diagnosis.

---

## 9. Running Locally

> **⚠️ Network prerequisite:** PostgreSQL ports 5432 and 6543 must be open on your network.
> If you are on a home Wi-Fi or corporate network that blocks these ports, use a **mobile hotspot** or **VPN** before running. Supabase HTTPS is always reachable but that only covers auth — all Prisma DB queries require a direct TCP connection on these ports. See Section 14 for full diagnosis.

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
#   SUPABASE_JWT_SECRET — from Supabase dashboard → Project Settings → API

# 3. Set up frontend environment
# Create: apps/frontend/.env.local  (git-ignored — must be created manually each clone)
cat > apps/frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://nvtyytyykdjhgtinhftd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
EOF
# Get the anon key from: Supabase Dashboard → Project Settings → API → anon/public key

# 4. Generate the Prisma client (required after every fresh npm install)
npx prisma generate --schema=apps/textile-flow-svc/prisma/schema.prisma

# 5. Start both services concurrently via Turborepo (from repo root)
npm run dev
# Backend  → http://localhost:3001  (NestJS, compiles TypeScript in watch mode ~20s)
# Frontend → http://localhost:3000  (Next.js, ready in ~15s)
# Shared   → packages/shared rebuilt automatically on change
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
| `GET http://localhost:3001/mills` | JSON array (may be empty `[]`) — confirms DB connection |
| `http://localhost:3000` | Dashboard or login page loads without white-screen |
| NestJS log | `Database connection established.` printed on startup |

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
- DTOs use `class-validator` decorators; always use `@IsOptional()` for optional fields
- All DB-mutating operations that touch multiple tables **must** use `prisma.$transaction(async (tx) => {...})`
- Inventory movements always go through `InventoryService.postInventoryMovement()` within the same transaction
- Audit log entries are written inline within transactions where needed

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
- Shared types/DTOs live in `packages/shared/src/`

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
| Frontend axios client | `apps/frontend/lib/api.ts` |
| Frontend fetch client | `apps/frontend/lib/api/client.ts` |
| PO form component | `apps/frontend/components/purchase-orders/PurchaseOrderForm.tsx` |
| Yarn Inward page | `apps/frontend/app/(app)/tracker/yarn-inward/page.tsx` |
| Analytics page | `apps/frontend/app/(app)/analytics/page.tsx` |
| Activity log service (backend) | `apps/textile-flow-svc/src/activity-logs/activity-logs.service.ts` |
| Activity log controller | `apps/textile-flow-svc/src/activity-logs/activity-logs.controller.ts` |
| Activity log module | `apps/textile-flow-svc/src/activity-logs/activity-logs.module.ts` |
| PO types | `apps/frontend/types/purchase-order.ts` |
| Entity types | `apps/frontend/types/entities.ts` |
| Deployment config | `render.yaml` |
| Backfill script | `apps/textile-flow-svc/scripts/backfill-yarn-inward.ts` |

---

## 13. Analytics System

### Architecture
The Analytics Dashboard (`/analytics`) has two data sources:

| Source | Value | How set |
|--------|-------|--------|
| `IMPORT` | Historical logs loaded from `.xlsx`/`.csv` | User drags file → frontend parses with `xlsx` library → `POST /activity-logs/bulk-import` |
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
| Purchase Orders | PO Created · PO Updated · PO Cancelled |
| Yarn Inward | Yarn Inward Created · Yarn Received · Yarn Inward Deleted |
| Knitter Programs | Knitter Program Created · Knitter Program Deleted |
| Memos | Dyeing Memo Created (includes lot numbers in `details`) |
| Dyeings | Dyeing Return Recorded · Dyeing Updated |
| Compactings | Compacting Created · Compacting Completed |

### Live Logging Pattern
```typescript
// In any service that imports ActivityLogsService:
void this.activityLogger.log({
  user: 'system',      // hardcoded until auth context is propagated
  action: 'PO Created',
  module: 'Purchase Orders',
  details: 'PO-2025-001 | YARN | Supplier: ABC Mills',
});
// MUST use void — never await. Swallows errors silently.
```

**To add logging to a new module:**
1. Import `ActivityLogsModule` in the feature module
2. Inject `ActivityLogsService` into the feature service constructor
3. Call `void this.activityLogger.log(...)` after the primary operation succeeds

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
| Both dev servers started | `npm run dev` from root → Turborepo starts `@textile-flow/shared`, `@textile-flow/frontend`, `textile-flow-svc` concurrently |

### Confirmed Working
- ✅ `http://localhost:3001/health` → `{"status":"ok"}`
- ✅ `http://localhost:3000` → Next.js frontend loads (dashboard page)
- ✅ Supabase HTTPS (port 443) → reachable (auth, REST API)
- ✅ NestJS TypeScript compilation → 0 errors
- ✅ Shared package (`@textile-flow/shared`) → builds and watches correctly

### Database Network Connectivity Issue

**Symptom:** All Prisma DB queries fail with `ETIMEDOUT` immediately after query execution.

**Diagnosis:**
```powershell
# Both of these return TcpTestSucceeded: False
Test-NetConnection -ComputerName "aws-1-ap-northeast-1.pooler.supabase.com" -Port 6543
Test-NetConnection -ComputerName "aws-1-ap-northeast-1.pooler.supabase.com" -Port 5432

# This succeeds (port 443 is open)
Invoke-WebRequest -Uri "https://nvtyytyykdjhgtinhftd.supabase.co/rest/v1/"
```

**Root Cause:** The Wi-Fi network/ISP blocks outbound TCP connections to non-HTTP ports. PostgreSQL runs on 5432 (direct) and 6543 (PgBouncer). Both are blocked at the router or ISP level. The HTTPS Supabase API works fine because port 443 is always open.

**This is NOT a code or credentials bug.** The app, credentials, and DB schema are all correct.

**Workarounds (pick one):**
1. **Mobile hotspot** (fastest): Switch your Wi-Fi to a phone hotspot — mobile data doesn't block these ports
2. **VPN**: Cloudflare WARP (free), ProtonVPN (free tier), or any VPN that routes TCP traffic normally
3. **Router firewall**: Log in to `172.16.208.1` → allow outbound TCP on ports 5432 and 6543
4. **ISP**: Contact your ISP to unblock outbound PostgreSQL connections

### Key File Locations After Setup
| File | Status | Notes |
|------|--------|-------|
| `apps/textile-flow-svc/.env` | ✅ Present, credentials updated | Contains DB + Supabase secrets |
| `apps/frontend/.env.local` | ✅ Created fresh | Git-ignored; must recreate on each clone |
| `node_modules/` (root) | ✅ Installed | Shared workspace packages |
| `apps/frontend/node_modules/` | ✅ Installed | Frontend-specific packages |
| `apps/textile-flow-svc/node_modules/` | ✅ Installed | Backend-specific packages |
| `node_modules/@prisma/client/` | ✅ Generated | Run `npx prisma generate` after each `npm install` |

### Important: `.env.local` is Git-Ignored
`apps/frontend/.env.local` is listed in `.gitignore` and will **not** be present after a fresh `git clone`. It must be created manually every time. The three required values are:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://nvtyytyykdjhgtinhftd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<get from Supabase Dashboard → Project Settings → API → anon/public>
```

---

## 15. GitHub CI & Linting Standards (2026-08-18)

### Repository URL
- **Canonical Repository:** [https://github.com/AnushkaAnnie/Fabric-Flow-new](https://github.com/AnushkaAnnie/Fabric-Flow-new)
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
| **TypeScript Unused Vars** | `@typescript-eslint/no-unused-vars` | Unused variables, imports, and interface declarations cause CI failures in strict mode. Remove unused types and destructured variables (e.g., unused `dyers`, `purchasedLots`, `SELECT_CLASS`, `Dyer`, `GreyFabricLot`, `nextNum`). |
| **Catch Blocks** | Unused error object | Use bare `try { ... } catch { ... }` or prefix with `_err` when the error object is not inspected in the logger/handler. |
| **Memo Line Mapping** | Sourced yarn lots | In `memos.service.ts`, ensure `hfCodes` is assigned to `hfCode` on returned memo line creation objects for multi-yarn program lots. |

### Verification Command
To verify linting passes before committing or pushing:
```bash
npx turbo run lint
# Expected: Tasks: 4 successful, 4 total (0 errors)
```

---

## Section 16 — Authentication System (Restored)

> **Status:** Fully active as of commit `79d9929` (2026-08-18).

Authentication was deliberately disabled during early development. It has now been fully restored and wired end-to-end.

### How It Works (End-to-End)

```
User visits protected page
        │
        ▼
ProtectedRoute (client-side)
  └─ calls getSupabaseSession()
  └─ if no session → router.replace('/login')
  └─ subscribes to onAuthStateChange for reactive sign-out
        │
        ▼
Login Page (/login)
  └─ calls signInWithSupabase(email, password)  [lib/auth.ts]
  └─ Supabase JS creates session, stores in cookie
  └─ on success → router.replace('/')
        │
        ▼
API calls (lib/api.ts / lib/api/client.ts)
  └─ interceptor reads getSupabaseAccessToken()
  └─ attaches Authorization: Bearer <JWT>
  └─ on 401 response → window.location.replace('/login')
        │
        ▼
NestJS Backend (JwtAuthGuard — global APP_GUARD)
  └─ checks @Public() metadata first — if public, allow through
  └─ reads Authorization: Bearer header
  └─ verifies JWT via JWKS (RS256) or SUPABASE_JWT_SECRET (HS256)
  └─ attaches req.user = { id, email, role } on success
  └─ throws 401 UnauthorizedException on failure
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
| `lib/api.ts` | Axios instance — auto-attaches Bearer token; redirects to `/login` on 401 |
| `lib/api/client.ts` | Fetch-based client — same Bearer token + 401 redirect pattern |
| `app/login/page.tsx` | Login UI with real Supabase auth, error/loading state, auto-redirect if logged in |
| `components/auth/protected-route.tsx` | Client-side route guard using `getSupabaseSession()` + `subscribeToAuthChanges()` |
| `components/layout/AppSidebar.tsx` | Logout → `signOutFromSupabase()` → redirect to `/login`; shows user email |

### Public Routes (Backend)

| Route | Why public |
|-------|-----------|
| `GET /` (AppController) | Has `@Public()` |
| `GET /health` | Raw Express route in `main.ts` — NestJS guard never runs on it |
| `GET /auth/me` | Has `@Public()` — always returns `{ user: null }` |

All other routes require a valid Supabase JWT Bearer token.

### Real User in Activity Logs

Activity logs now record the authenticated user's email via `resolveUser(req)` (falls back to user ID → `'system'`). Wired in:
`yarn-inward`, `purchase-orders`, `memos`, `knitter-programs`, `dyeings`, `compactings` — controllers pass `resolveUser(req)` to service methods.

### Static Export Constraint

`next.config.js` sets `output: 'export'`. **Next.js middleware does NOT run in production** (Render serves static files). All route protection is enforced **client-side** in `ProtectedRoute`.

### Required Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend `.env.local` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Frontend `.env.local` | Supabase anon key |
| `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` | Backend `.env` | Used to construct JWKS URL |
| `SUPABASE_JWT_SECRET` | Backend `.env` | Required for HS256 JWT verification |

