# Working on this repo

## Branches

```
main                    always deployable
feat/<scope>-<what>     feat/sales-order-history
fix/<scope>-<what>      fix/accounts-modal-scroll
```

Scopes: `sales`, `accounts`, `admin`, `ui`, `api`, `chore`.

Commits follow Conventional Commits: `feat(sales): add order history accordion`.

## Before you push

```bash
npm run typecheck && npm run build
```

Both must pass. The build catches things the dev server tolerates.

## Conventions

**Colours come from `tailwind.config.ts`.** If you find yourself writing
`bg-[#131B2E]`, add a token instead. This is what makes a palette change a
one-file edit.

**Components never call `fetch`.** Add a method to the relevant service in
`src/lib/api/services/` and call it through React Query.

**New query? Add a key to `src/lib/api/queryKeys.ts`.** Inline key arrays make
cache invalidation guesswork.

**Server Components by default.** Add `"use client"` only when you need state,
effects, or event handlers.

**Every interactive element needs an accessible name.** Icon-only buttons take
`aria-label`. Inputs take a real `<label>` or `aria-label`.

## Adding a screen

1. Put the route in the right group: `(sales)`, `(accounts)`, `(admin)`
2. Reuse `src/components/ui` primitives before writing new ones
3. Handle three states explicitly: loading (skeleton), empty (`EmptyState`), error
4. Check it at 375px, 768px and 1280px before opening the PR

## Definition of done

- [ ] Matches the Figma frame at desktop and mobile widths
- [ ] Loading, empty and error states all handled
- [ ] Keyboard reachable, focus ring visible
- [ ] `npm run typecheck` and `npm run build` pass
- [ ] No hardcoded hex, no direct `fetch`
