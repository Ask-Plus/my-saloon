# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a ladies' salon booking mobile app (Expo) and a backend API server (Express + PostgreSQL).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (server-side request validation only)
- **API codegen**: Orval (generates React Query hooks + types from OpenAPI spec)
- **Build**: esbuild
- **Mobile**: Expo (React Native) with expo-router

## Artifacts

### Salon Booking App (`artifacts/mobile`)
- **Type**: Expo mobile app
- **Preview Path**: `/`
- Ladies' salon appointment booking app
- Two roles: Customer and Salon Owner
- Features:
  - Customer: Browse services, book appointments, choose stylist, select time slot, simulated card payment, manage bookings
  - Owner: Dashboard with stats, manage services/stylists/time slots, view and update all appointments
- Data persistence: PostgreSQL via REST API (React Query hooks from `@workspace/api-client-react`)
- Auth: Login via `POST /api/users/login`, persisted in AsyncStorage
- Payment: Simulated payment flow (UI mock with card form, 1.5s delay)
- Theme: Rose primary `#B5566A`, cream background `#FDF6F0`, gold accent `#C9934A`

### API Server (`artifacts/api-server`)
- **Type**: API
- **Preview Path**: `/api`
- Express 5 REST API with full CRUD for salon domain
- Auto-seeds DB on first startup (8 services, 3 stylists, 288 time slots for 14 days)
- Zod used for **request** validation only; responses use plain `res.json()` (dates serialize automatically)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client hooks + Zod schemas from `lib/api-spec/openapi.yaml`
  - After codegen always rewrite `lib/api-zod/src/index.ts` to only: `export * from "./generated/api";`
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## API Endpoints

All mounted under `/api`:
- `POST /users/login` — upsert user by phone+role, return user with integer `id`
- `GET/POST /services` — list / create services
- `GET/PATCH/DELETE /services/:id`
- `GET/POST /stylists`
- `GET/PATCH/DELETE /stylists/:id`
- `GET /time-slots?date&stylistId&available` — filterable slot list
- `POST /time-slots`, `GET/DELETE /time-slots/:id`
- `GET /appointments?customerId` — all or filtered by customer
- `POST /appointments` — create + mark slot as booked
- `GET/PATCH /appointments/:id` — get or update status (cancelling unbooks slot)
- `GET /dashboard/stats` — todayCount, upcomingCount, totalRevenue, openSlotsCount

## Library Packages

- `lib/api-spec` — OpenAPI spec (`openapi.yaml`) + Orval config
- `lib/api-client-react` — generated React Query hooks (e.g. `useGetServices`, `useCreateAppointment`)
- `lib/api-zod` — generated Zod request schemas (e.g. `CreateServiceBody`, `GetTimeSlotsQueryParams`)
- `lib/db` — Drizzle schema + DB client (`usersTable`, `servicesTable`, `stylistsTable`, `timeSlotsTable`, `appointmentsTable`)

## Mobile App Structure (`artifacts/mobile`)

```
app/
  _layout.tsx              # Root layout: setBaseUrl, QueryClientProvider, AuthProvider
  index.tsx                # Auth redirect
  (auth)/login.tsx         # Login/signup with role selection
  (customer)/              # Customer tab navigation
    index.tsx              # Services list (useGetServices)
    appointments.tsx       # My bookings (useGetAppointments + useUpdateAppointment)
    profile.tsx            # Profile + stats
  (owner)/                 # Owner tab navigation
    index.tsx              # Dashboard (useGetDashboardStats)
    services.tsx           # Manage services (full CRUD)
    stylists.tsx           # Manage stylists (full CRUD)
    slots.tsx              # Manage time slots (useGetTimeSlots + useCreateTimeSlot)
    appointments.tsx       # All bookings (useGetAppointments + useUpdateAppointment)
  book/
    [serviceId].tsx        # Step 1: Date/stylist/slot picker
    payment.tsx            # Step 2: Simulated card payment
    confirm.tsx            # Step 3: Animated confirmation
context/
  AuthContext.tsx          # User auth (login calls API, persisted in AsyncStorage)
types/index.ts             # Shared TypeScript interfaces (all IDs are number)
```

## Important Notes

- All entity IDs are integers (not strings). Use `String(item.id)` in `keyExtractor`.
- `useGetServices()` etc. return `data` which may be `undefined` — always default: `data ?? []`
- Mutation calls: `useUpdateService().mutate({ id, data: body })`, `useDeleteService().mutate({ id })`
- `useGetTimeSlots(params, options)` — pass `{ query: { enabled: !!dep } }` for conditional fetching
- Base URL set via `setBaseUrl()` from `@workspace/api-client-react` using `EXPO_PUBLIC_DOMAIN`
