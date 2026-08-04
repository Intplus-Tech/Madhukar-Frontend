# Lakshya 72 — Sales Order Management

Frontend for Madhukar Domestic Appliances. One Next.js app serving three roles:
**sales** (phone), **accounts** (desktop), **admin** (desktop).

---

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The app runs entirely on mock data — no backend required.

### Signing in

There are no passwords yet (the Figma login screen has none). The mock layer
routes you by email prefix:

| Email                | Lands on    |
| -------------------- | ----------- |
| `akshay@mdapl.com`   | `/sales`    |
| `accounts@mdapl.com` | `/accounts` |
| `admin@mdapl.com`    | `/admin`    |

Any name works. Seeded users in `src/lib/api/mock/seed.ts` also sign in by their
own address.

### Scripts

| Command             | Does                        |
| ------------------- | --------------------------- |
| `npm run dev`       | Dev server                  |
| `npm run build`     | Production build            |
| `npm run typecheck` | `tsc --noEmit`, no emit     |
| `npm run lint`      | Next's ESLint               |

---

## Structure

```
src/
├── app/
│   ├── login/                  # shared entry point
│   ├── (sales)/                # phone shell + bottom tabs
│   │   └── sales/
│   │       ├── page.tsx            # dashboard
│   │       ├── plan/               # morning planning
│   │       ├── plan/update/        # end-of-day update
│   │       ├── order/              # dealer search
│   │       ├── order/[dealerId]/   # compose order
│   │       ├── report/             # planned vs achieved
│   │       └── notifications/
│   ├── (accounts)/             # black sidebar shell
│   │   └── accounts/
│   │       ├── page.tsx            # System Overview
│   │       └── orders/             # billing queue
│   └── (admin)/                # navy #131B2E sidebar shell
│       └── admin/
│           ├── page.tsx            # dashboard + chart
│           ├── orders/             # queue
│           ├── orders/[id]/        # order detail
│           └── reports/            # team performance
├── components/
│   ├── ui/                     # primitives — Button, Card, Modal, Table…
│   ├── layout/                 # sidebars, top bar, bottom nav, headers
│   ├── shared/                 # cross-role: StatCard, OrdersTable, RoleGuard
│   ├── sales/  accounts/  admin/
├── lib/
│   ├── api/
│   │   ├── http.ts             # fetch wrapper + auth header
│   │   ├── services/           # auth, dealers, planning, orders, reports…
│   │   ├── mock/               # seed data + in-memory store
│   │   └── queryKeys.ts        # React Query keys
│   ├── constants/              # navigation, status maps
│   └── utils/                  # cn, currency/date formatting
├── providers/                  # React Query, auth, toast
└── types/domain.ts             # the domain contract
```

Route groups `(sales)` / `(accounts)` / `(admin)` exist so each role gets its own
layout shell. The parentheses keep them out of the URL — `/sales`, not
`/(sales)/sales`.

---

## Wiring up the real backend

The UI never calls `fetch` directly. Every network call goes through a service
in `src/lib/api/services/`, and each service branches on one flag.

**Step 1.** Set `NEXT_PUBLIC_USE_MOCK_API=false` and point
`NEXT_PUBLIC_API_BASE_URL` at the backend.

**Step 2.** In each service, the `if (!USE_MOCK)` branch already contains the
call. Correct the paths and payload shapes against the swagger:

```ts
async list(filters, page, pageSize) {
  if (!USE_MOCK)
    return http.get<Paginated<SalesOrder>>("/sales-orders", { ...filters, page, pageSize });
  // …mock implementation below
}
```

**Step 3.** Reconcile `src/types/domain.ts` against the swagger. Comments marked
`CONFIRM` flag things inferred from the walkthrough rather than stated. The three
that matter most:

- **Money format.** Typed as `number` in major units. If the API sends
  `"45.00"` as a string or `4500` in paise, every currency display breaks.
- **Whether `billed` is a real status.** Modelled as `pending → billed →
  completed | rejected`. It may collapse to `pending → completed | rejected`.
- **Whether `VisitUpdate` is a separate record.** Split from `VisitPlan` so
  "planned 45, collected 25" keeps both numbers. If the backend overwrites one
  field, the report page can't show variance.

**Step 4.** Delete `src/hooks/use-lookup.ts` once list endpoints return
`dealerName` and `salesRepName` on each row. Keeping it against a real API would
turn every table into an N+1 fetch.

**Step 5.** Delete `src/lib/api/mock/` and the `USE_MOCK` branches.

Nothing in `src/app/` or `src/components/` changes in any of this.

---

## Design tokens

Every colour lives in `tailwind.config.ts`. No raw hex in components.

| Token                   | Value     | Where                         |
| ----------------------- | --------- | ----------------------------- |
| `bg-app`                | `#F7F9FB` | page background               |
| `bg-surface`            | `#FFFFFF` | cards, panels, modals         |
| `admin-sidebar`         | `#131B2E` | admin sidebar                 |
| `accounts-sidebar`      | `#000000` | accounts sidebar              |
| `admin-accent`          | `#1E3A5F` | "Send feedback & notify team" |
| `success`               | `#00A76F` | chart bars, progress ring     |
| `danger-deep`           | `#A11212` | "Send feedback to Sales"      |
| `warning`               | `#F59E0B` | unbilled line-item checkbox   |

Type scale runs `eyebrow` (11px) → `display-lg` (48px), transcribed from Figma.

### Fonts

`Inter` for body, `Poppins` for display headings — both via `next/font/google`
in `src/app/layout.tsx`. **The display face was matched by eye.** If the Figma
names a different one, change that import; nothing else references a family.

### Logo

`src/components/shared/brand-mark.tsx` is a hand-drawn approximation. Drop the
real artwork at `public/logo.svg` and swap the component body for
`<Image src="/logo.svg" … />`.

---

## Known gaps

**`RoleGuard` is client-side only.** It redirects after hydration, which is fine
for development but is not access control — the bundle is readable by anyone.
Move it to `middleware.ts` when real auth lands.

**Notifications are polled**, not pushed. If the backend offers websockets or
SSE, swap the React Query poll in `TopBar` / `MobileHeader`.

**The map button on Planning is inert.** No mapping provider was specified.

**Feedback is modelled as a flat list** on an order, not a thread. Supports
either — confirm which the backend implements.

---

## Reading of the Figma worth confirming

The Planning Update frame shows **"PAYMENT PLAN" twice**. Implemented as
ORDER PLAN + PAYMENT PLAN, matching the walkthrough. If two payment fields are
genuinely intended, change `DealerPlanCard` in
`src/components/sales/dealer-plan-card.tsx`.
