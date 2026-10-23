---
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-plan-bootstrap
execution: code
title: Safety Hardening and Discovery Enhancements - Plan
type: feat
date: 2026-10-23
deepened: 2026-10-23
---

# Safety Hardening and Discovery Enhancements

## Goal Capsule

**Objective:** Close the real defects a code review surfaced in the just-landed privacy/safety verification work, then extend the private library and public feed with the discovery and export capabilities writers need next, without widening the product beyond its current anonymous-journaling identity.
**Means:** Hardening work lands first (shared moderation-pattern source, auth and effect-lifecycle fixes, test and CI infrastructure), then three feature units build on that hardened foundation (library tagging/search, public-feed discovery reconciliation, private note export).
**Product Authority:** Monetization, physical fulfillment, newsletter curation, and native/offline apps stay deferred to post-launch per the original plan's settled decision (see origin: docs/plans/2026-10-16-1734-feat-library-of-unsent-things-plan.md); open public comments, vanity/profile metrics, and social-identity login remain outside this product's identity.
**Open Blockers:** None.
**Execution Profile:** Standard iterative implementation across a Supabase Edge Function, React components, a database migration, test infrastructure, and a new CI workflow.
**Completion & Handoff:** Hand off to `ce-work` for unit-by-unit execution, using `ce-debug` where a fix needs investigation, `ce-test-browser` to verify UI changes, `security-review` before shipping the moderation and auth fixes, and `ce-commit-push-pr` to ship each unit.

---

## Product Contract

### Summary
This plan hardens four real defects in the Library of Unsent Things' safety and auth code, then adds tagging/search to the private library, reconciles the public feed's discovery UI (which a recent redesign broke), and lets writers export their own notes.

### Problem Frame
The U10 privacy-verification work that just landed left real gaps: the moderation benchmark only proves the client-side fallback classifier safe, never the Edge Function that actually gates public content in production, so the two pattern lists can drift apart with no CI signal; a stale demo-mode profile can survive into a real-Supabase session; the moderation API call has no timeout; and a cancellation-guard pattern meant to prevent stale async state is duplicated across three components with zero test coverage, while a fourth component (the public feed) has no such guard at all. Separately, the product has grown past the work the original 8-week plan authorized into a page redesign on the public feed that quietly dropped a working search/filter/sort UI. Writers also have no way to find an old note by tag or keyword, or take their own writing with them.

### Key Decisions
- **Hardening ships before new features.** The code-review findings are real defects, not polish, so they are sequenced as a prerequisite phase ahead of the enhancement units. Governs R1, R2, R3, R4, R5
- **The product's settled scope boundary holds.** Billing, print fulfillment, newsletter curation, and native/offline apps stay deferred; open public comments, profile/vanity metrics, and social-identity login stay outside this product's identity (see origin: docs/plans/2026-10-16-1734-feat-library-of-unsent-things-plan.md). Governs R6, R7, R8, R9
- **Exported notes exclude locked content by default.** A locked note's protection is a client-side passcode gate on viewing, not at-rest encryption (a pre-existing, unchanged architecture decision); export does not add new passcode or crypto handling, so a locked note is only included in an export if the writer has already unlocked it in the current session. Governs R9

### Requirements

#### Safety Pipeline Integrity
- R1. The moderation Edge Function and its client-side test fallback must derive their self-harm/PII pattern lists from one shared source, so the two can never silently drift apart.
- R2. The Edge Function's external moderation API call must time out and fall back to the local heuristic within a bounded time instead of hanging indefinitely.

#### Auth and Effect-Lifecycle Correctness
- R3. `AuthContext` must never leave a stale demo-mode profile populated once a configured deployment resolves that there is no active real session.
- R4. The duplicated cancellation-guard loading pattern in the library, author-inbox, and threaded-responses views must be consolidated into one shared, tested hook; the public feed's note-loading effect must gain the same cancellation protection it currently lacks.

#### Delivery Infrastructure
- R5. The project must run lint, typecheck, and the full test suite (including new component tests) in CI on every pull request.

#### Private Library Discovery
- R6. Writers must be able to tag their own notes and find a note again by searching title, content, or tag within their private library.

#### Public Feed Discovery
- R7. The public feed must let readers search and sort published notes, built against the feed's current bookshelf-section browsing rather than reviving the taxonomy the recent redesign orphaned.
- R8. The public feed must show a loading indicator while its initial notes are fetched.

#### Personal Data Portability
- R9. A writer must be able to export their own authored notes as a downloadable file for their own records.

### Success Criteria
- The Edge Function and the client fallback classifier read their self-harm/PII patterns from one file; a CI check fails if either side imports something else.
- A hung external moderation call degrades to the local heuristic within the configured timeout instead of stalling the request.
- A configured deployment with no active session never shows a stale demo-mode profile or pen name, however the browser's `localStorage` was previously used.
- Each of the four note-loading views (library, author inbox, threaded responses, public feed) has a passing test proving a stale async response is discarded after unmount or a prop change.
- CI blocks a pull request that fails lint, typecheck, or any test suite.
- A writer can locate a specific old note by tag or keyword in the private library without scrolling the full list.
- A reader can search and sort published notes on the public feed through the new control, and sees a loading indicator while notes first load.
- A writer can download their own unlocked notes as a file outside the app.

### Scope Boundaries

#### Active Scope
- R1-R9 above.

#### Deferred to Follow-Up Work
- Server-side full-text search indexing for the private library, if a writer's note count grows large enough that client-side filtering becomes noticeably slow on keystroke (no fixed threshold set; revisit if it is reported or observed).
- Exporting response letters or shelf metadata alongside notes.
- SHA-pinning the new CI workflow's action versions (ship with tag pins now, pin to SHAs as a fast-follow).
- A passcode-gated export path that includes locked notes without requiring the writer to unlock them first.

#### Deferred for Later (Post-Launch)
*(carried forward from the original plan, see origin: docs/plans/2026-10-16-1734-feat-library-of-unsent-things-plan.md)*
- Paid subscription billing for unlimited shelves and locked notes.
- Physical print-on-demand fulfillment ("Year in Letters").
- Editorial newsletter curation platform and sponsorships.
- Native mobile apps or offline PWA sync.

#### Outside This Product's Identity
*(carried forward from the original plan)*
- Real-time messaging or unvetted open public comment threads.
- Public writer profiles, follower counts, or vanity metrics.
- Social-identity login integrations that risk unmasking pen names.

#### Considered and Not Built
- **At-rest encryption for locked notes.** Raised by research as a gap (locked notes are UI-masked, not encrypted), but it is a pre-existing architecture decision (KTD4 of the original plan) this plan does not reopen; revisit only if a future review finds the current passcode gate is being bypassed, not as part of this plan's export work.

---

## Planning Contract

### Key Technical Decisions
- KTD1. **Shared moderation-pattern module.** Move `SELF_HARM_PATTERNS`/`PII_PATTERNS` into one JSON file at `supabase/functions/_shared/moderation-patterns.json` (pattern + flags as strings, not literal regex), imported by both `supabase/functions/screen-content/index.ts` (via Supabase's existing cross-function `_shared/` convention, which the CLI already bundles) and `src/services/moderation.ts` (a plain relative import, resolved at Vite build time). Governs R1
- KTD2. **Bounded moderation timeout, and a retired default model fixed in the same pass.** Wrap the Edge Function's `fetch()` to the external moderation API in an `AbortController` with a 5-second timeout, `clearTimeout` in a `finally` block. While touching this call, also add the request's missing `model` field: OpenAI retired the legacy `text-moderation-*` models (the undocumented default this call falls back to when `model` is omitted) on 2025-10-27 in favor of `omni-moderation-latest`, so this call has likely been silently failing and falling back to the local heuristic ever since -- explicitly set `model: "omni-moderation-latest"`. Governs R2
- KTD3. **Demo-session gating fix.** Gate `AuthContext`'s demo-session lazy initializer behind `!isSupabaseConfigured`, and add the missing `setProfile(null)` to the no-session branch of the initial `getSession()` resolution, matching the existing `onAuthStateChange` handler's logout reset. Governs R3
- KTD4. **`useCancellableLoad` hook, with a `refetch` escape hatch.** A new shared hook (the first custom hook in this codebase) wrapping the "pure loader function + `cancelled` flag" pattern already hand-duplicated in `LibraryPage`, `AuthorInbox`, and `ThreadedResponses`; apply it to those three call sites and newly to `PublicFeedPage`'s currently-unguarded fetch effect. The hook also returns a `refetch()` function that bumps the same cancellation token the deps-driven effect uses, so `AuthorInbox`'s manual refresh button participates in the same guard instead of calling the loader directly outside it. Governs R4
- KTD5. **Component-testing infrastructure.** Add `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom`'s Vitest entry point; a `test` block in `vite.config.ts`; and `src/test/setup.ts` registering `afterEach(cleanup)`. Cancellation-guard tests use `vi.advanceTimersByTimeAsync` with a manually-resolved mock promise to control mount/unmount timing relative to the async resolution. Governs R4, R5
- KTD6. **CI workflow.** A GitHub Actions workflow with two jobs: a Node job running `npm run lint && npm run typecheck && npm test` (tag-pinned `actions/checkout@v4` / `actions/setup-node@v4` for now, per the Deferred-to-Follow-Up SHA-pinning item), and a separate `deno check supabase/functions/screen-content/index.ts` job (type-check only; no `deno test`, since the function has no Deno-runtime test file). Governs R5
- KTD7. **Client-side tags and search.** Add a `tags text[]` column to `notes`; tag editing and the title/content/tag search live entirely client-side over the writer's already-fetched note list, with no server-side search index. Governs R6
- KTD8. **Feed discovery reconciliation, not revival.** Delete `src/components/feed/FeedFilter.tsx` and `src/components/feed/PublicNoteCard.tsx` as dead code superseded by `InteractiveBookshelf` (confirmed zero remaining importers); add a new search+sort control that filters/sorts the same note list `InteractiveBookshelf` renders, built against its existing `SHELF_SECTIONS` taxonomy rather than `FeedFilter`'s incompatible `CATEGORIES` list. Governs R7
- KTD9. **Export scope, with unlock state lifted to where export can see it.** Produce one downloadable JSON file containing the writer's own notes (title, content, tags, shelf, timestamps); a note currently locked and not yet unlocked in the session is skipped, with a visible count of how many were skipped. Today "unlocked this session" is private `useState` inside each `NoteCard` instance (and, separately, inside `BookReaderModal`), invisible to `LibraryPage` or any service -- export cannot honor the skip rule until that state has one shared, session-scoped home. `LibraryPage` owns a `Set<string>` of unlocked note IDs; `NoteCard` reports a successful unlock into it instead of (or alongside) its local flag; `export.ts` takes that set as a parameter rather than inferring unlock status from the note object alone. This is a one-time move of existing state, not new crypto or persistence -- the set lives only as long as the page session, same as today's per-card flag. Governs R9

### High-Level Technical Design

U5's correctness rests on getting the mount/unmount race right inside `useCancellableLoad`. The shape below is the contract every call site must satisfy:

```mermaid
sequenceDiagram
    participant Component
    participant Hook as useCancellableLoad
    participant Loader as loader()

    Component->>Hook: mount / deps change
    Hook->>Loader: invoke loader()
    Note over Hook: cancelled = false

    alt deps change again, or component unmounts, before loader resolves
        Component->>Hook: cleanup runs
        Hook->>Hook: cancelled = true
    end

    Loader-->>Hook: resolves (rows, or null on error)
    alt cancelled is true
        Hook->>Hook: discard result -- no setState
    else cancelled is false
        Hook->>Component: setState(rows); setLoading(false)
    end
```

`refetch()` (KTD4) re-enters this same diagram at the "invoke loader()" step, bumping the cancellation token exactly as a deps change does, so a manual refresh and an automatic re-render share one guard.

### Assumptions
- A 5-second timeout (KTD2) is a judgment call: the existing local-heuristic fast path already short-circuits most content before the external call ever runs, and no authoritative source gives a moderation-specific number under 10s. Tune if real latency data says otherwise.
- `jsdom` (not `happy-dom`) is the chosen DOM environment for KTD5, matching current Vitest + React Testing Library convention.
- Client-side search/filter (KTD7, KTD8) is assumed sufficient at this app's expected note-count scale; revisit only if real usage shows otherwise (see Deferred to Follow-Up Work).

---

## Risks & Dependencies

- **OpenAI's legacy moderation default was retired 2025-10-27, but whether this call was ever live in production is unverified.** Current OpenAI documentation confirms the legacy `text-moderation-latest` default (what this call falls back to, since it omits the `model` field) was retired in favor of `omni-moderation-latest`. The call only ever executes when `MODERATION_API_KEY` is set (`supabase/functions/screen-content/index.ts`'s `if (apiKey && ...)` guard); nothing in this plan checks whether that secret was ever configured in the deployed project. Decision: U2 fixes the `model` field and adds a timeout regardless, since both are correct on their own merits, but U2 also adds a verification step to check the deployed secret/logs so the plan does not overstate a production impact it has not confirmed.
- **Deno JSON import-attribute compatibility is unverified against the deployed Edge Runtime.** KTD1's shared pattern file needs `with { type: "json" }` on the Deno side. Decision: verify the deployed runtime's Deno version at U1/U2 implementation time; if it predates import-attribute support, fall back to a Deno-side `JSON.parse` of a text import instead (recorded as an Assumption, not left as a silent risk).
- **CI needs no new secrets.** Confirmed: `npm run test:security` and `npm run test:moderation` are static/local-heuristic tests today (no live Supabase network calls), so the Node CI job (U1) runs with no Supabase credentials.
- **CI pins Node 20, matching the existing deploy target.** `netlify.toml` sets `NODE_VERSION = "20"` and `package.json` declares no `engines` constraint that would rule it out; the CI workflow (U1) pins the same Node 20 baseline rather than a different version, so CI exercises the same runtime the app actually deploys to. Deno is pinned separately via `denoland/setup-deno@v1` for the Edge Function job.

---

## Implementation Units

### U1. CI workflow for lint, typecheck, test, and Edge Function type-check
- **Goal:** Give every pull request an automated gate, so the fixes in U2-U5 land under CI from the start.
- **Requirements:** R5
- **Dependencies:** None
- **Files:**
  - `.github/workflows/ci.yml` (new)
- **Approach:**
  1. Node job: checkout, `actions/setup-node@v4` pinned to the repo's Node 20 baseline (matching `netlify.toml`'s `NODE_VERSION`), `npm ci`, then `npm run lint && npm run typecheck && npm test`.
  2. Deno job: checkout, `denoland/setup-deno@v1`, then `deno check supabase/functions/screen-content/index.ts`.
  3. Both jobs run on `pull_request` and `push` to the default branch.
- **Patterns to follow:** Reuse the existing `npm run lint` / `npm run typecheck` / `npm test` scripts verbatim; do not invent new script names.
- **Test scenarios:**
  - Test expectation: none -- CI configuration only; verified by observing the workflow run green on this unit's own PR.
- **Verification:** The workflow runs on this unit's PR and all steps pass.

---

### U2. Shared moderation-pattern module and Edge Function timeout
- **Goal:** Remove the drift risk between the deployed moderation classifier and its client-side test mirror, and stop the external moderation call from hanging.
- **Requirements:** R1, R2
- **Dependencies:** None
- **Files:**
  - `supabase/functions/_shared/moderation-patterns.json` (new)
  - `supabase/functions/screen-content/index.ts`
  - `src/services/moderation.ts`
  - `tests/moderation-benchmark.test.ts`
- **Approach:**
  1. Extract the self-harm and PII pattern lists from both files into the new shared JSON (KTD1); confirm the Deno-side JSON import syntax against the deployed Edge Runtime's Deno version (see Risks & Dependencies) before committing to `with { type: "json" }`.
  2. Update both consumers to import from the shared file; delete the now-redundant hand-copied arrays in each.
  3. Check whether `MODERATION_API_KEY` is actually configured in the deployed Supabase project, and if so, check the function's logs for non-2xx responses from the moderation call; record what was found (not assumed) in the Risks & Dependencies entry before or alongside the fix below.
  4. Add `AbortController` + 5s timeout + `clearTimeout` in a `finally` block around the external `fetch()` call (KTD2); remove the log line that currently claims a timeout exists.
  5. Add the missing `model: "omni-moderation-latest"` field to the same request body (KTD2) -- the call has been omitting `model` entirely, which falls back to OpenAI's now-retired legacy default.
  6. Extend `tests/moderation-benchmark.test.ts` with an assertion that both consumers' pattern sources resolve to the same shared file (a static equality/import check), so a future edit to one side that bypasses the shared file fails CI.
- **Patterns to follow:** The existing benchmark's corpus-driven test shape (`CRISIS_PHRASES`, `PII_PHRASES` arrays run through `screenNoteContent`).
- **Test scenarios:**
  - Happy path: a phrase present in the shared pattern file is still correctly held/flagged by both the Edge Function's heuristic and the client fallback.
  - Edge case: the external moderation API call exceeds the timeout window; assert the function falls back to the local heuristic result rather than hanging or erroring.
  - Edge case: the external call's request body includes `model: "omni-moderation-latest"` (assert on the constructed request, not a live network call).
  - Integration: the static check added in step 6 fails if `screen-content/index.ts` or `moderation.ts` is edited to reference a pattern array that is not the shared file.
- **Verification:** `npm run test:moderation` passes, including the new drift-check assertion; the Edge Function's `deno check` (U1) still passes.

---

### U3. Fix AuthContext stale demo-profile bug
- **Goal:** Stop a demo-mode profile from surviving into a configured, no-session real deployment.
- **Requirements:** R3
- **Dependencies:** None
- **Files:**
  - `src/contexts/AuthContext.tsx`
  - `tests/pseudonyms.test.ts` (extend, or a new `tests/auth-context.test.ts`)
- **Approach:**
  1. Gate `readDemoSession()`'s lazy-initializer call behind `!isSupabaseConfigured` (KTD3), restoring the pre-existing invariant that demo state cannot exist when a real backend is configured.
  2. Add `else { setProfile(null); }` to the initial `getSession().then()` branch, mirroring the existing `onAuthStateChange` handler's logout reset.
- **Patterns to follow:** The `onAuthStateChange` handler's own no-session branch is the template for step 2.
- **Test scenarios:**
  - Happy path: with `isSupabaseConfigured` true and no `localStorage` demo session, `user` and `profile` both start `null`.
  - Edge case: with `isSupabaseConfigured` true and a demo profile already in `localStorage`, `readDemoSession()` is never called and neither `user` nor `profile` is seeded from it.
  - Edge case: with `isSupabaseConfigured` true and `getSession()` resolving no session, `profile` ends `null` (not whatever it started as).
- **Verification:** The three scenarios above pass as plain Vitest unit tests against the extracted gating logic (no component-rendering infra required for this unit).

---

### U4. Component-testing infrastructure
- **Goal:** Make React component and hook-lifecycle behavior testable, which U5 and U6/U7 need.
- **Requirements:** R4, R5 (supporting)
- **Dependencies:** None
- **Files:**
  - `vite.config.ts`
  - `src/test/setup.ts` (new)
  - `package.json`
- **Approach:**
  1. Add `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom` to `devDependencies`.
  2. Add a `test` block to `vite.config.ts`: `environment: 'jsdom'`, `setupFiles: ['src/test/setup.ts']`.
  3. `src/test/setup.ts` imports `@testing-library/jest-dom/vitest` and registers `afterEach(cleanup)` from `@testing-library/react`.
- **Patterns to follow:** None yet in this codebase -- this unit establishes the first component-testing convention.
- **Test scenarios:**
  - Test expectation: none -- tooling/config only; verified by U5's tests actually rendering a component under this setup.
- **Verification:** A throwaway smoke render (`render(<div>ok</div>)` plus `screen.getByText('ok')`) passes, then is removed before this unit is considered done.

---

### U5. `useCancellableLoad` hook, applied to all four note-loading views
- **Goal:** Replace the hand-duplicated cancellation-guard pattern with one tested hook, and close the gap where the public feed has no cancellation protection at all.
- **Requirements:** R4
- **Dependencies:** U4
- **Files:**
  - `src/hooks/useCancellableLoad.ts` (new)
  - `src/hooks/useCancellableLoad.test.ts` (new)
  - `src/pages/LibraryPage.tsx`
  - `src/components/library/AuthorInbox.tsx`
  - `src/components/feed/ThreadedResponses.tsx`
  - `src/pages/PublicFeedPage.tsx`
- **Approach:**
  1. Build `useCancellableLoad` per the High-Level Technical Design sequence above: takes a loader function and its dependency array, manages `loading`/`cancelled` internally, calls back with the result only when still mounted and current, and returns a `refetch()` function that re-runs the loader under the same cancellation bookkeeping (KTD4).
  2. Replace each of the three existing hand-written `let cancelled = false` sites (`LibraryPage`, `AuthorInbox`, `ThreadedResponses`) with the hook; `AuthorInbox`'s manual `handleRefresh` button calls the hook's `refetch()` instead of invoking the loader directly, so a manual refresh participates in the same guard as the automatic effect.
  3. While touching `AuthorInbox`, also set `loading` back to `true` at the start of a reopen, fixing the loading-state regression a prior review flagged.
  4. Apply the hook to `PublicFeedPage.tsx`'s `fetchPublicNotes` effect, which currently has no cancellation guard; this closes a real, previously-unflagged gap.
- **Technical design:** See the High-Level Technical Design sequence diagram above; every call site must satisfy that mount/cleanup/resolve ordering.
- **Test scenarios:**
  - Happy path: loader resolves while the component is still mounted with the same deps; state updates with the resolved rows.
  - Edge case: component unmounts before the loader resolves (mock a held promise, unmount, then resolve it via `vi.advanceTimersByTimeAsync`); assert no `setState` is called and no React warning is logged.
  - Edge case: deps change (re-render with a new `noteId`/`userId`) before the first loader call resolves; assert the stale first response never reaches state and only the second call's result does.
  - Error path: loader rejects or resolves `null`; assert `loading` still clears and existing state is left untouched (matches current "leave list as-is on failure" behavior).
  - Integration: `AuthorInbox` reopened after a prior close shows `loading: true` again before the refetch resolves.
  - Integration: calling `refetch()` while a prior loader call is still in flight cancels the prior call's result, so only the refetch's result reaches state.
- **Verification:** `npm test` passes, including the new hook test and the four updated call sites' existing test coverage (none currently exists for these files beyond what this unit adds).

---

### U6. Private library tagging and search
- **Goal:** Let a writer tag notes and find one again by title, content, or tag.
- **Requirements:** R6
- **Dependencies:** U4
- **Files:**
  - `supabase/migrations/<timestamp>_add_note_tags.sql` (new)
  - `src/types/database.ts`
  - `src/pages/LibraryPage.tsx`
  - `src/components/editor/NoteEditor.tsx`
  - `src/services/notes.ts` (new)
- **Approach:**
  1. Migration adds a nullable `tags text[]` column to `notes`, defaulting to `'{}'`.
  2. Add `tags?: string[] | null` to the `Note` type.
  3. `NoteEditor` gets a simple tag input (comma-or-enter-separated chips); each chip has a dismiss (x) control, and Backspace on an empty input removes the last chip. Tag matching and storage are case-insensitive; re-adding an existing tag (by case-insensitive match) is a no-op, not a duplicate chip. Saved alongside the note's existing fields.
  4. `LibraryPage` gets a search box filtering the already-fetched note list by title, content, or tag substring match (KTD7, case-insensitive), combined with the existing shelf-selection filter (AND, not OR).
  5. New `src/services/notes.ts` holds the tag-aware note-loading logic for this unit's touched paths, starting the consolidation the repo research flagged (inline-vs-services split) without migrating untouched existing query code.
  6. Demo-mode parity: tags persist to and read from the same `localStorage` note objects used today.
- **Patterns to follow:** `src/services/reporting.ts` and `src/services/moderation.ts` for the services-layer shape; `LibraryPage`'s existing shelf-filter `useState` for how client-side filtering already composes with fetched state.
- **Test scenarios:**
  - Happy path: a note tagged `"grief", "letters"` is found by searching `"grief"`.
  - Happy path: a note is found by a content substring match with no tag involved.
  - Edge case: search query matches nothing; the empty state is distinct from the "no notes at all" empty state.
  - Edge case: a note with no tags (`tags: null` or `[]`) is still searchable by title/content.
  - Edge case: search combined with an active shelf filter narrows to the intersection, not the union.
  - Integration: in demo mode, a tag added to a note persists across a page reload (read back from `localStorage`).
- **Verification:** New Vitest component tests for the search/filter behavior pass under U4's infrastructure; a manual `ce-test-browser` pass confirms the tag input and search box render and behave correctly in both demo and Supabase-configured mode.

---

### U7. Public feed discovery reconciliation
- **Goal:** Restore search/sort on the public feed without reviving the taxonomy a recent redesign orphaned, and restore the missing loading indicator.
- **Requirements:** R7, R8
- **Dependencies:** U5
- **Files:**
  - `src/components/feed/FeedFilter.tsx` (delete)
  - `src/components/feed/PublicNoteCard.tsx` (delete)
  - `src/pages/PublicFeedPage.tsx`
  - `src/components/bookshelf/InteractiveBookshelf.tsx`
- **Approach:**
  1. Delete `FeedFilter.tsx` and `PublicNoteCard.tsx` (confirmed zero remaining importers) rather than rewiring them, since their `CATEGORIES` taxonomy does not reconcile cleanly with `InteractiveBookshelf`'s `SHELF_SECTIONS` (KTD8).
  2. Add a new, small search+sort control to `PublicFeedPage`, filtering/sorting the same `notes` array passed into `InteractiveBookshelf` (free-text search over title/content/pen name, latest/oldest sort) -- the control lives above the bookshelf and narrows what it renders, rather than duplicating `InteractiveBookshelf`'s own section browsing.
  3. Restore a loading indicator for `fetchPublicNotes`'s initial call (removed in the recent redesign), using U5's `useCancellableLoad` so the loading state is correctly cleared only for the current, non-stale request.
- **Patterns to follow:** The deleted `FeedFilter`'s search-input shape is a reasonable starting point for the new control's UI, even though its category logic is not reused.
- **Test scenarios:**
  - Happy path: typing a search term narrows the rendered notes to title/content/pen-name matches.
  - Happy path: switching sort order changes rendered note ordering by `published_at`.
  - Edge case: search plus `InteractiveBookshelf`'s own section browsing composes as a narrowing filter, not a conflicting one.
  - Edge case: the initial fetch shows a loading indicator, then renders notes once resolved; a slow-resolving fetch does not show stale notes from a prior page view.
  - Edge case: search narrows results to zero matches; a distinct no-results message is shown rather than an empty bookshelf.
  - Verify no remaining import of `FeedFilter` or `PublicNoteCard` anywhere in `src/` after deletion.
- **Verification:** `npm run typecheck` passes with the two files deleted; new tests for the search+sort control pass; a manual `ce-test-browser` pass confirms the public feed shows a loading state on first load and that search/sort behave correctly.

---

### U8. Private note export
- **Goal:** Let a writer download their own authored notes.
- **Requirements:** R9
- **Dependencies:** U4
- **Files:**
  - `src/services/export.ts` (new)
  - `src/pages/LibraryPage.tsx`
  - `src/components/library/NoteCard.tsx`
- **Approach:**
  1. Lift "unlocked this session" out of `NoteCard`'s private `isUnlocked` state: `LibraryPage` owns a `Set<string>` of unlocked note IDs; `NoteCard` reports a successful passcode entry up to `LibraryPage` (e.g. an `onUnlock(noteId)` callback) instead of only tracking it locally (KTD9). The set lives only for the page session, same lifetime as today's per-card flag -- this is not new persistence.
  2. `src/services/export.ts` builds a JSON array of the writer's own notes (title, content, tags if U6 has shipped, shelf name, `created_at`/`published_at`), taking the unlocked-ID set as a parameter and skipping any note with `is_locked: true` whose ID is not in it (KTD9).
  3. Serialize to a `Blob` and trigger a browser download via a temporary `<a>` element -- no new dependency needed. On a failed `Blob`/download step, show an inline error rather than failing silently.
  4. `LibraryPage` gets an "Export my notes" action that calls this service and shows a one-line summary after every export ("Exported 12 notes" or, when any were skipped, "Exported 12 notes; 2 locked notes were skipped") -- not only when notes were skipped.
  5. Demo-mode parity: export reads from the same `localStorage` note list used elsewhere; the unlocked-ID set behaves identically in both modes since it is page-session state, not persisted either way.
- **Patterns to follow:** None existing in this codebase for file download; this is new ground.
- **Test scenarios:**
  - Happy path: exporting a library with only unlocked notes produces a JSON file containing all of them, with a summary showing no skips.
  - Edge case: a locked-but-currently-unlocked note (passcode already entered this session, present in the lifted `Set<string>`) is included.
  - Edge case: a locked-and-not-unlocked note is skipped, and the skip count in the summary message matches.
  - Edge case: an empty library (no notes) still produces a valid, empty export rather than erroring.
  - Error path: a failed `Blob`/download step shows an inline error instead of appearing to do nothing.
  - Integration: unlocking a note via `NoteCard`, then exporting, includes that note -- proving the lifted state actually reaches `export.ts`.
  - Integration: demo-mode export reads the same notes a Supabase-configured export would, from `localStorage` instead of a query.
- **Verification:** New Vitest tests for the skip/include logic pass under U4's infrastructure; a manual `ce-test-browser` pass confirms the downloaded file's contents match what was visible in the library at export time.

---

## Verification Contract

| Command | Covers |
|---|---|
| `npm run lint` | Style/lint gate (CI, U1) |
| `npm run typecheck` | Type safety across all units, including U7's deletions |
| `npm test` | Full Vitest suite, including new component tests from U4-U8 |
| `npm run test:security` | Pre-existing RLS policy assertions (unaffected by this plan) |
| `npm run test:moderation` | Moderation benchmark, extended in U2 with the drift-check assertion |
| `deno check supabase/functions/screen-content/index.ts` | Edge Function type-check (CI, U1/U2) |

`security-review` runs before shipping U2 (moderation/safety-critical) and U3 (auth), per the Completion & Handoff note above.

---

## Definition of Done

### Global Criteria
- All 8 units implemented with passing tests and the CI workflow (U1) green on each unit's own change.
- No remaining import of `FeedFilter.tsx` or `PublicNoteCard.tsx` anywhere in the repo.
- No dead-end or experimental code left over from an approach that did not pan out (e.g., the U4 smoke-test render is removed once real tests exist).
- `security-review` has been run against U2 and U3's diffs before they ship.

### Per-Unit Criteria
- U1: CI workflow runs on a pull request and both jobs pass.
- U2: `npm run test:moderation` passes including the drift-check assertion; the Edge Function's external call has a verified bounded timeout.
- U3: The three AuthContext test scenarios pass.
- U4: A real test (from U5) renders successfully under the new `jsdom` environment.
- U5: All four note-loading views use `useCancellableLoad`, including `AuthorInbox`'s manual refresh via `refetch()`; the hook's test scenarios pass.
- U6: Tags are searchable (case-insensitively) in both demo and Supabase-configured mode; chip removal works.
- U7: Search/sort work on the public feed, including a distinct no-results state; the loading indicator is restored; the orphaned files are deleted.
- U8: `LibraryPage`'s unlocked-ID set actually reaches `export.ts`; export respects the locked-note exclusion rule, gives feedback on both success and failure, and works in both demo and Supabase-configured mode.
