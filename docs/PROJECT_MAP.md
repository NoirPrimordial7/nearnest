# Nearnest — Project Map

_Snapshot taken: 2026-04-24. Re-run the `repo-understanding` skill before trusting this._

## Repo type
React + Vite web portal with Firebase backend, Firestore rules, Cloud Functions stub, and Firebase Data Connect scaffolding. Mobile app is **not yet scaffolded** — a placeholder lives at `apps/mobile/`.

## Top-level folders
| Path | Purpose | Ownership |
|------|---------|-----------|
| `src/` | React web portal source (Vite) | **Website team — do not touch** |
| `public/` | Static web assets | **Website team — do not touch** |
| `functions/` | Firebase Cloud Functions (Node) | **Website team — do not touch** |
| `dataconnect/` | Firebase Data Connect schema + examples | **Website team — do not touch** |
| `scripts/` | Maintenance scripts | Read-only for AI agents |
| `docs/` | Human + AI memory (this file) | **AI-editable** |
| `.claude/` | Claude Code config + skills | **AI-editable** |
| `apps/mobile/` | Reserved for React Native / Expo app | **AI-editable (after user go)** |

## Protected root files (never edit)
- `package.json`, `package-lock.json`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`, `firestore.indexes.json`
- `vite.config.js`, `eslint.config.js`
- `.env.example`, `README.md`, `.firebaserc`
- `cors.json`, `apphosting.emulator.yaml`
- `main.jsx` (root)
- `serviceAccountKey.json` (sensitive — never commit or move)

## Safe work areas for AI agents
- `.claude/skills/**`
- `docs/**`
- `apps/mobile/**` (after explicit go-ahead)

## Web portal (`src/`) structure
```
src/
├── App.jsx                # Route table (React Router v7)
├── App.css
├── main.jsx
├── index.css
├── assets/
├── components/            # NavBar, Sidebar, MainContent
├── components copy/       # (duplicated backup folder — do not touch)
├── lib/
│   ├── firebase.js        # Firebase client init
│   └── firestoreHelpers.js
├── pages/
│   ├── Admin/             # Admin portal (Dashboard, Stores, Verification, Support)
│   ├── Admin copy/        # backup
│   ├── Auth/              # SignIn, SignUp, VerifyEmail, AuthContext
│   ├── Landing/
│   ├── NearnestHome.jsx   # Root "/" landing
│   ├── RegisterStore/
│   ├── StoreAdmin/        # Store admin layout + Inventory, Settings, Ads, Support, Dashboard
│   ├── SupportTeam/
│   ├── register-store/    # CreateStore, UploadDocuments, ReviewSubmit, VerificationStatus
│   ├── routes/            # ProtectedRoute
│   └── user/              # UserHome, UserProfiles, RequireProfile
├── styles/
└── utils/
    └── places.js          # Google Places integration helper
```

## Routes (from `src/App.jsx`)
| Path | Role gate | Component |
|------|-----------|-----------|
| `/` | public | `NearnestHome` |
| `/signin` `/signup` `/verify-email` | public | Auth screens |
| `/home` | user, storeAdmin, admin | `UserHome` (wraps `RequireProfile`) |
| `/setup-profile` | user, storeAdmin, admin | `UserProfile` |
| `/register-store` | user, storeAdmin | `CreateStore` |
| `/upload-docs/:id` | user, storeAdmin | `UploadDocuments` |
| `/review-submit/:id` | user, storeAdmin | `ReviewSubmit` |
| `/verification-status/:id` | user, storeAdmin | `VerificationStatus` |
| `/admin` (+ `stores`, `verification`, `support`) | admin | `AdminLayout` + children |
| `/store-admin/:storeId/*` | — (guard inside layout) | `StoreAdminLayout` + Dashboard, Inventory, Settings, Advertisement, Support |

## Firebase surface
- **Auth:** email/password with email verification (`VerifyEmail` route)
- **Firestore collections referenced in rules:** `users`, `roles`, `stores`, `stores/{id}/documents`, `stores/{id}/verificationLogs`, and a catch-all sub-pattern under stores
- **Storage paths:** `avatars/{uid}/*`, `storeDocs/{storeId}/*` (images + PDFs only, owner/member gated)
- **Realtime Database:** rules file exists (`database.rules.json`) but usage TBD
- **Cloud Functions:** `functions/index.js` currently exports only `helloWorld` — no business logic yet
- **Data Connect:** scaffolded in `dataconnect/` (schema + seed data). Not yet load-bearing.
- **Firestore region:** `asia-south1`
- **Emulator ports (firebase.json):** auth 9099, firestore 8081, functions 5010, storage 9199, hosting 5000, dataconnect 9399, apphosting 5002
- **Client env (`VITE_FIREBASE_*`):** standard Firebase web config only. Google Maps/Places key is separate and not in `.env.example` yet — flag for architect.

## Dependencies that matter (from `package.json`)
- React 19, React Router 7
- Firebase 12
- `@googlemaps/js-api-loader`, `lucide-react`, `react-icons`, `recharts`, `date-fns`
- Build: `rolldown-vite` (shimmed as `vite`)

## Observations / flags for next agent
- `src/components copy/`, `src/pages/Admin copy/`, `src/pages/StoreAdmin copy/` look like manual backup folders — ignore them, do not edit.
- `serviceAccountKey.json` is committed at repo root. **Security risk** — flag in next security review, but do not touch in this task.
- `.env` and `.env.local` are committed (check `.gitignore`). Also flag.
- Cloud Functions are effectively empty — all protected server logic (orders, payments, prescription approval) still needs to be designed and implemented by the web/backend team.
- No test framework is configured in `package.json`.
