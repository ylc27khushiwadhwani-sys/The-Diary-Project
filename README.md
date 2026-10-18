# The Library of Unsent Things 🕯️

> An anonymous sanctuary for the things you carry but never say out loud.

*The Library of Unsent Things* is an anonymous digital sanctuary where writers carry their unspoken thoughts in quiet honesty. Writers authenticate with email magic link, receive a poetic pseudonymous pen name, organize their thoughts into private custom shelves, unlock reflective prompts, and selectively share notes publicly. 

Every note submitted to the public library undergoes automated AI safety screening for self-harm language and personal identifying details. Notes touching upon crisis receive an empathetic, supportive hold and instant access to free, confidential helplines. Readers cannot post unvetted public comments; instead, they send thoughtful "letters in response" that land in the author's private inbox first—allowing the author to cherish them privately or pin them to their public letter.

---

## ✦ Key Architectural Pillars

### 1. Zero Identity Exposure & Pseudonymous Pen Names
- **Auth via Email Magic Link:** Writers authenticate securely through Supabase Auth.
- **Strict Separation of Identity:** The database `profiles` table stores solely the user's generated `pen_name` (e.g. *Silent Quill #482*) and avatar color. Real email addresses never exist in public database tables or application client state.

### 2. Private Shelves & Eyes-Only Note Locking
- **Custom Shelves:** Curate letters across themes like *Unspoken Words*, *Grief & Healing*, and *Closure*.
- **Client-Side PIN Locking:** Sensitive notes can be locked with a 4-to-8 digit PIN. Passcodes are salted and hashed using browser-native **Web Crypto API (SHA-256)**. Unlocked content stays entirely in-memory and is never persisted in plaintext when locked.

### 3. Selective Note-by-Note Public Sharing
- Notes default to private. Authors consciously toggle sharing on an individual note level.
- Authors can unshare or delete their letters at any time.

### 4. Empathetic AI Safety & Supportive Holds
- Public submissions pass through the `screen-content` moderation pipeline (Supabase Edge Function / local rule engine).
- If self-harm or crisis language is detected, the note is **never deleted or discarded** from the writer's private sanctuary. Instead, it is transitioned to `held_private`, and the author is immediately provided with a gentle, confidential **Helpline Modal** listing verified 24/7 crisis hotlines.

### 5. Author-Governed Response Letters
- Readers can draft "Letters in Response".
- Responses do **not** appear publicly by default. They arrive in the original author's **Private Letters Inbox**.
- Only the author can decide whether to keep the response private or pin it publicly beneath their letter.

### 6. Community Moderation & Auto-Hide Backstop
- Readers can report problematic content.
- A database trigger automatically transitions any note with $\ge 3$ reports to `flagged_hidden` and unpublishes it immediately.

---

## ✦ Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS with `@tailwindcss/typography`
- **Icons:** `lucide-react`
- **Build & Dev Tooling:** Vite 6, Vitest
- **Backend & Auth:** Supabase (Auth, PostgreSQL, Row-Level Security, Edge Functions)
- **Zero-Config Demo Mode:** Automatically runs in offline/demo mode via `localStorage` when Supabase environment variables are not supplied.

---

## ✦ Project Structure

```text
├── src/
│   ├── components/
│   │   ├── auth/           # PenNameBadge, SignInModal
│   │   ├── editor/         # NoteEditor, LockNoteToggle
│   │   ├── feed/           # PublicNoteCard, FeedFilter, ResponseComposer, ThreadedResponses, ReportModal
│   │   ├── library/        # ShelfManager, PromptSelector, NoteCard, PasscodeModal, ShareModal, AuthorInbox
│   │   └── safety/         # HelplineModal
│   ├── contexts/           # AuthContext (Supabase Auth & Guest Demo session state)
│   ├── data/               # prompts.json, helplines.json
│   ├── lib/                # supabase.ts (client & environment detection)
│   ├── pages/              # PublicFeedPage, LibraryPage
│   ├── services/           # moderation.ts, reporting.ts
│   ├── types/              # database.ts
│   ├── utils/              # crypto.ts, pseudonyms.ts
│   ├── App.tsx             # Root layout and tab routing
│   ├── index.css           # Tailwind base styles and parchment aesthetics
│   └── main.tsx            # DOM root mounting
├── supabase/
│   ├── functions/
│   │   └── screen-content/ # Deno Edge Function for automated moderation
│   └── migrations/
│       ├── 20261016_initial_schema.sql  # Schema definitions (5 tables)
│       ├── 20261016_rls_policies.sql   # Strict Row Level Security policies
│       └── 20261016_triggers.sql       # User creation & 3-report auto-hide trigger
└── tests/                  # Vitest automated test suites
    ├── crypto.test.ts
    ├── pseudonyms.test.ts
    ├── moderation.test.ts
    └── rls-security.test.ts
```

---

## ✦ Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install Dependencies
```powershell
npm.cmd install
```

### 2. Run the Development Server
```powershell
npm.cmd run dev
```
Open `http://localhost:5173` in your browser. The application runs immediately in **Sanctuary Demo Mode** with pre-seeded public letters and offline persistence.

### 3. Run Automated Tests
```powershell
npm.cmd test
```

---

## ✦ Connecting to Supabase (Optional for Production)

To connect the application to a live Supabase project:

1. Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Populate `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Execute the SQL migrations in your Supabase SQL editor in order:
   - `supabase/migrations/20261016_initial_schema.sql`
   - `supabase/migrations/20261016_rls_policies.sql`
   - `supabase/migrations/20261016_triggers.sql`
4. Deploy the Edge Function:
   ```powershell
   supabase functions deploy screen-content
   ```
