# Phase 11 — Account, settings, security, legal

Branch: `fe-phase-11-account-settings-legal`
Scope: FR-C03 (account/profile), NFR-4 (theme persistence). Other tabs untouched.

---

## 1. Inspection findings (before changes)

- **`ProfileScreen.tsx` does not exist** — deleted in Phase 4. The current Account tab is a small shell (avatar, demo card, sign out, version). The prompt's "hardcoded" is stale; the tab was rebuilt.
- **Theme persistence already existed** (Phase 2): `ThemeProvider` takes an injected `ThemeStorage` and `App.tsx` passes `AsyncStorage`, persisted under `@trustlink/theme-mode`. Phase 11 only exposes it in the UI (`useTheme().mode/setMode`) — the Demo menu already had a theme control.
- **Profile write path was unused**: `auth.updateProfile(patch)` (→ `PUT /auth/profile`) had no hook and no screen. The mock rejects phone/role changes, matching the contract (`400 Phone number cannot be changed`).
- **Account read an inconsistent value**: it displayed `session.user` (persisted at sign-in) and a hardcoded "Version 0.1.0" while `app.json` says `1.0.0`. Now the header reads `useProfile()` (query) so edits show immediately, and the version comes from one constant (`appInfo.ts`, kept in step with `app.json`).
- **Sign out was immediate and left the stack**: no confirmation, and the caller navigated to `Auth` without resetting, so back gestures could return to the account. Now confirms, then `navigation.reset({ routes: [{ name: 'Auth' }] })`; `signOut()` already clears the token and query cache.
- **Terms/Privacy were external placeholder URLs** (`https://trustlink.ng/terms`) opened via `Linking` on the auth screen — `SCAFFOLD_REGISTER.md` assigned their replacement to this phase.
- **No account-deletion route exists** anywhere in the contract → deferred per the prompt (SC‑33).
- Reused: `Card`, `ListItem`, `Avatar`, `Badge`, `Banner`, `Dialog`, `Input`, `Skeleton`, `ErrorState`, `SegmentedControl`-style choice rows, `isEmail`, `formatDate`. **No new dependencies.**

## 2. Summary (≤5 lines)

- Account tab rebuilt as grouped lists (Profile · Preferences · Support · Legal & about · Demo · Danger) with the profile read from the ports and a destructive zone visually separated.
- Edit profile (`PUT /auth/profile` via the port) with an immutable phone, optional email validation, and success/error banners.
- Appearance (System/Light/Dark) surfaced from the existing persisted ThemeProvider.
- Security: sign-out confirmation that clears the token/query cache and resets the stack; delete-account explained and routed to support (deferred, no fake deletion).
- Real Terms and Privacy prose (NDPA context) marked **"Draft for legal review"**, plus an About screen with version, tagline and the demo-data note.

## 3. Files created / modified / deleted

**Created (8)**
| Path | Why |
|---|---|
| `apps/customer/src/screens/account/appInfo.ts` | App name/version/tagline/demo-data notice (single source; mirrors `app.json`) |
| `apps/customer/src/screens/account/legalContent.ts` | Terms (8 sections) + Privacy (7 sections, NDPA) real prose + draft notice |
| `apps/customer/src/screens/account/EditProfileScreen.tsx` | Name/email edit, immutable phone, validation, loading/error states |
| `apps/customer/src/screens/account/AppearanceScreen.tsx` | System / Light / Dark with selected state and a persistence note |
| `apps/customer/src/screens/account/TermsScreen.tsx` | In-app Terms with draft banner |
| `apps/customer/src/screens/account/PrivacyScreen.tsx` | In-app Privacy (NDPA) with draft banner |
| `apps/customer/src/screens/account/AboutScreen.tsx` | Version, tagline, service area, demo-data note, legal/help links |
| `docs/frontend/reports/PHASE-11-REPORT.md` | This report |

**Modified (7)**
| Path | Why |
|---|---|
| `apps/customer/src/hooks/useAuth.ts` | `useUpdateProfile` (invalidates `['profile']`) |
| `apps/customer/src/navigation/types.ts` | `EditProfile`, `Appearance`, `Terms`, `Privacy`, `About` |
| `apps/customer/src/navigation/AppNavigator.tsx` | Wire the five screens |
| `apps/customer/src/screens/AccountScreen.tsx` | Rebuilt: grouped lists, profile from ports, sign-out confirm, delete-account notice, consistent version |
| `apps/customer/src/screens/auth/PhoneEntryScreen.tsx` | Consent line now opens the in-app Terms/Privacy (was external URLs) |
| `docs/frontend/SCAFFOLD_REGISTER.md` | Removed the Account + consent-link rows |
| `docs/frontend/CONTRACT_LEDGER.md` | SC-33 (deletion deferred), SC-34 (legal drafts) |

**Deleted (0)**

## 4. Dependencies added

none.

## 5. Commands run with real output

```
apps/shared$ npm run typecheck             → tsc --noEmit -p tsconfig.logic.json  (clean, no shared changes)
apps/shared$ npm test                      → Test Files 12 passed (12) · Tests 128 passed (128)
apps/shared$ node scripts/contrast-check.mjs → ALL CHECKS PASSED
hex-literal scan (new files)               → (no matches)
apps/customer$ npm run typecheck           → tsc --noEmit  (clean)
apps/customer$ npx expo export --platform android
                                           → Android Bundled 35616ms index.ts (1563 modules) · Exported
apps/rider$    npm run typecheck           → tsc --noEmit  (clean)
apps/rider$    npx expo export --platform android
                                           → Android Bundled 20962ms index.ts (1491 modules) · Exported
apps/admin$    npm run build               → ✓ 135 modules transformed · ✓ built in 2.31s
apps/admin$    npm run lint                → ran this time: "Found 2 warnings and 0 errors. Finished in 70ms on 13 files"
                                              (the OS-policy block was not hit on this run; admin app untouched)
```
No `duplicate-react-native` warning.

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| Account shows name, immutable phone, optional email | ✓ | `AccountScreen` header (from `useProfile`) + `EditProfileScreen` phone `editable={false}` with note |
| Edit profile via `PUT /auth/profile` (port) | ✓ | `useUpdateProfile` → `auth.updateProfile` → `PUT /auth/profile`; invalidates `['profile']` |
| Appearance (System/Light/Dark) | ✓ | `AppearanceScreen` writing through the persisted `ThemeProvider` |
| Theme persistence from Phase 2 | ✓ | `App.tsx` passes `AsyncStorage`; storage key `@trustlink/theme-mode`; verified by restarting the app (step 4 below) |
| Security: sign out | ✓ | Destructive button + confirm dialog → `signOut()` (token + query cache cleared) |
| Logout clears the stack and token | ✓ | `signOut()` clears token/cache; `navigation.reset({ routes: [{ name: 'Auth' }] })` |
| Delete-account request (deferred) | ✓ | "Delete account" → dialog explaining the gap + **Contact support** (SC‑33) — no fake deletion |
| Terms + Privacy (NDPA context) | ✓ | `legalContent.ts` (8 + 7 sections), rendered in-app, each with a **"Draft for legal review"** banner |
| About (version, tagline, demo-data note) | ✓ | `AboutScreen` (`Version 1.0.0`, "Secure. Swift. Strategic.", demo-data banner) |
| Grouped lists; destructive distinct | ✓ | `Group` sections; destructive button in its own block after a `Divider` |
| Legal text is real prose, not lorem ipsum | ✓ | Full sentences on service, fares, cancellation, restrictions, liability, NDPA rights — no placeholder lines |
| Loading / error / empty states | ✓ | `EditProfileScreen` skeleton + error + banners; account renders from cached session while the profile loads |
| No dead handlers | ✓ | Every row/button navigates, opens a dialog, or opens a link |
| Other tabs untouched | ✓ | Only `AccountScreen` + auth consent line changed outside the new screens |
| Both themes | ✓ | tokens only (hex scan clean) |

## 7. Deviations and why

- **`ProfileScreen.tsx` was already deleted** (Phase 4) — nothing to delete; the Account tab was rebuilt in place.
- **Version is a constant in `appInfo.ts`** (`expo-constants` is not on the approved dependency list) — it is kept in step with `app.json` (`1.0.0`) and replaced the previous hardcoded "0.1.0".
- **Delete account is a request/notice, not an action** — no deletion endpoint exists and the backend is frozen (SC‑33).
- **Phone-entry consent now navigates in-app** instead of opening external URLs (the register assigned this to Phase 11).
- **Sign-out resets the navigator** rather than only clearing state, so Back cannot re-enter the account.

## 8. Ledger rows added / "Needs decision"

- **SC-33 (Needs decision)** — no account-deletion endpoint; the UI explains the gap and routes to support (DEFERRED as instructed).
- **SC-34 (Resolved)** — Terms/Privacy are now in-app real drafts (legal sign-off pending).
- No change to earlier rows.

## 9. Scaffolds still present

- Onboarding "Slides" copy (Phase 17); the permanent `__DEV__` Design Gallery; the Demo menu.
- **The Account and consent-link rows were removed** — the register now lists only those two permanent/art items.

## 10. Known issues, risks, open questions

- **Account deletion is unavailable** (no endpoint) — NDPA erasure requests must go through support (SC‑33).
- **Legal text is a draft**; it must be signed off by counsel before launch (SC‑34).
- **Support contact details remain placeholders** (SC‑31) and `About` shows "Support: Placeholder".
- **The demo-data notice is always shown**, even if a build is later pointed at the live API (it is accurate for R1 demo builds).
- **Email verification is not implemented** — the optional email is stored but never confirmed (no endpoint).
- SC-2 / SC-5 / SC-8 / SC-16 / SC-17 / SC-19 / SC-20 / SC-21 / SC-22 / SC-23 / SC-26 / SC-27 / SC-30 / SC-31 / SC-33 remain open.

## 11. How a human verifies this phase manually

1. `cd apps/customer && npx expo start -c`, Expo Go, sign in (`08031234567` / `482913`).
2. **Account** → grouped sections render; header shows Amina Bello / 0803 123 4567 / amina.bello@example.com; the phone field in **Edit profile** is not editable.
3. **Edit profile** → change the first name and add an email → **Save changes** → success banner; go back and confirm the header updates. Enter `not-an-email` → inline validation error.
4. **Appearance** → choose **Dark** → the whole app switches immediately; fully close and reopen the app → still Dark. Choose **System** and toggle the device theme.
5. **Terms of Service** / **Privacy Policy** → real prose with the "Draft for legal review" banner (scroll to see the NDPA rights section).
6. **About TrustLink** → version 1.0.0, tagline, service area, demo-data note, links to Terms/Privacy/Help/feedback.
7. **Sign out** → confirm dialog → *Stay signed in* keeps you in place; *Sign out* returns to the phone-entry screen, and the system Back gesture cannot return to the account.
8. **Delete account** → dialog explains deletion isn't available and offers **Contact support** → opens Help.
9. Sign-in screen: tap **Terms of Service** / **Privacy Policy** in the consent line → opens the in-app screens.

## 12. Proposed commit message and file list

```
feat(customer): phase 11 account, settings, security and legal

- customer: Account rebuilt as grouped lists (Profile / Preferences / Support / Legal &
  about / Demo / Danger) with the profile read from the ports and the version from one constant
- customer: Edit profile (PUT /auth/profile via useUpdateProfile) with immutable phone,
  email validation and success/error banners
- customer: Appearance (System/Light/Dark) surfaces the persisted ThemeProvider
- customer: sign-out confirmation clears the token/cache and resets the stack; delete-account
  request explains the deferred backend gap and routes to support (SC-33)
- customer: in-app Terms and Privacy with real prose marked "Draft for legal review" (SC-34),
  plus About; the auth consent line now opens them in-app
- docs: ledger SC-33/SC-34, scaffold register now lists only permanent items
```

Files to stage (15 — 8 created, 7 modified): as listed in §3.

STOPPED. Awaiting approval for the next phase.
