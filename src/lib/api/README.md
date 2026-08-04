# The API layer

Everything that touches the network lives here. The point of the structure is
that swapping mock data for the real backend touches these files only —
`src/app/` and `src/components/` never change.

```
http.ts          fetch wrapper: base URL, auth header, error shape, response unwrap
queryKeys.ts     React Query cache keys
services/        one file per domain area — the app's public API surface
mock/seed.ts     seed data lifted from the Figma screens
mock/db.ts       mutable in-memory store, survives Fast Refresh
```

## The pattern

Every service method has the same shape:

```ts
async getSomething(id: string): Promise<Thing> {
  if (!USE_MOCK) return http.get<Thing>(`/things/${id}`);   // real
  return delay(db.things.find(t => t.id === id) ?? null);   // mock
}
```

`USE_MOCK` reads `NEXT_PUBLIC_USE_MOCK_API`. `delay()` fakes latency so loading
states get exercised in development rather than only appearing in production.

## Mock mutations are real

`db.ts` holds mutable state, so submitting a plan or billing an order actually
changes what later reads return. Placing an order pushes a notification to the
accounts user; sending feedback flips the order to `rejected` and notifies the
rep. The full loop is walkable without a backend. State resets on reload.

## When the swagger arrives

1. Flip `NEXT_PUBLIC_USE_MOCK_API=false`
2. Correct paths and payload shapes in the `if (!USE_MOCK)` branches
3. Reconcile `src/types/domain.ts` — see the `CONFIRM` comments
4. Check the response envelope in `http.ts` — it currently unwraps
   `{ success, data }` defensively, which may be wrong
5. Delete `mock/` and the branches once everything is green

## Adding an endpoint

Add the method to the relevant service, add a key to `queryKeys.ts`, export from
`index.ts` if it's new. Don't call `http` from a component.
