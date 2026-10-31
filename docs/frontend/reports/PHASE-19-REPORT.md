# Phase 19 — Reproducible EAS builds (npm workspace)

Branch: `fe-phase-19-reproducible-eas-builds` (from `master` @ `c0ed8ac`)
Scope: repo/build configuration + release docs. Backend untouched, no new dependency beyond the approved `expo-constants`, `eas build` never run, no login.

---

## 1. Inspection findings (before changes)

- **The repo had no workspace**: `apps/customer`, `apps/rider`, `apps/admin`, `apps/shared` were four independent npm projects, each with its own `package-lock.json`, and the two mobile apps depended on `@trustlink/shared` via **`file:../shared`** — which EAS cannot upload (`apps/` only), the SC-45 blocker.
- **Both `metro.config.js` files declared the wrong workspace root**: `workspaceRoot = path.resolve(projectRoot, '..')` (= `apps/`) with `nodeModulesPaths = [projectRoot/node_modules]`. Correct for `file:`, wrong for a repo-root install — Metro would not find hoisted packages.
- **`expo-modules-core` was a direct dependency in both apps** (introduced by the SDK 57 `expo install --fix` alignment) and expo-doctor flagged it; a grep of `apps/*/src/**` proved **no source file imports it** → safe to remove (it stays available transitively via `expo`).
- **`app.json` was static**: no way to vary the package id/name per profile, `userInterfaceStyle: "light"` (SC-46), and the version was duplicated in code (`apps/customer/src/screens/account/appInfo.ts` hardcoded `APP_VERSION = '1.0.0'`).
- **BUILD.md lived in `docs/frontend/`**, and the new rule puts release docs in `docs/release/`.
- Root had no `package.json`, so `node_modules` and lockfiles were per-app.

## 2. Summary (≤5 lines)

- The repo is now **one npm workspace** (`package.json` → `workspaces: ["apps/*"]`, single root `package-lock.json`, hoisted `node_modules`); `@trustlink/shared` is the workspace dependency `"*"` and Metro configs point at the repo root — **SC-45 closed**.
- `expo-modules-core` removed from both apps, `userInterfaceStyle` → `"automatic"` (**SC-46 closed**), and a root `react`/`react-dom` override pins one React 19.2.3 for the whole workspace.
- **`expo-doctor: 21/21 in both apps — "No issues detected"** (was 19/21), and both apps still bundle (1562 / 1506 modules) with **no duplicate `react-native`**.
- `app.config.ts` per app drives everything from `APP_VARIANT`; `eas.json` gained a third profile (`preview-api`) alongside `preview` and `production`.
- Release docs moved to `docs/release/BUILD.md`, rewritten for building/installing from the repo root; the About screen reads its version from `expo-constants`.

## 3. Files created / modified / deleted

**Created (6)**
| Path | Why |
|---|---|
| `package.json` (root) | Private workspace root: `workspaces: ["apps/*"]`, React override, helper scripts |
| `package-lock.json` (root) | The single lockfile (394 KB) replacing four per-app lockfiles |
| `apps/customer/app.config.ts`, `apps/rider/app.config.ts` | Config as code per `APP_VARIANT` (name, package, `userInterfaceStyle: automatic`) |
| `docs/release/BUILD.md` | Release/build/install doc for the workspace layout |
| `docs/frontend/reports/PHASE-19-REPORT.md` | This report |

**Modified (11)**: `apps/customer/package.json`, `apps/rider/package.json` (`@trustlink/shared: "*"`, `expo-modules-core` removed, `expo-constants` added) · `apps/admin/package.json` (`react`/`react-dom` = `19.2.3`) · `apps/customer/eas.json`, `apps/rider/eas.json` (three profiles + `APP_VARIANT`) · `apps/customer/metro.config.js`, `apps/rider/metro.config.js` (repo-root `watchFolders` + both `nodeModulesPaths`) · `apps/customer/src/screens/account/appInfo.ts` (version from `expo-constants`) · `docs/frontend/CONTRACT_LEDGER.md` (SC-45/46 closed, SC-48 added) · `docs/frontend/HANDOFF.md` §7 · `docs/frontend/DEMO.md` §11.

**Deleted (7)**: `apps/customer/package-lock.json`, `apps/rider/package-lock.json`, `apps/admin/package-lock.json`, `apps/shared/package-lock.json` (superseded by the root lockfile) · `apps/customer/app.json`, `apps/rider/app.json` (replaced by `app.config.ts`) · `docs/frontend/BUILD.md` (moved to `docs/release/BUILD.md`).

**Total: 24 (6 created, 11 modified, 7 deleted)**

## 4. Dependencies added

`expo-constants@57.0.22` in both mobile apps (`npx expo install`) — needed to read the app version at runtime. **Removed:** the direct `expo-modules-core` dependency (both apps). The other four approved packages (`@sentry/react-native`, `expo-updates`, `@react-native-community/netinfo`, `expo-image-manipulator`) are **not installed**: no task in this phase needs them, and each requires its own config/phase.

## 5. Commands run with real output

```
$ npm install (root, NODE_ENV=development)        → one root lockfile (394 KB); apps' lockfiles/node_modules removed first
$ npm ls react-native                             → react-native@0.86.3 everywhere, all "deduped" (no duplicates)
$ npm ls react --depth=0                          → react@19.2.3 for shared/admin/customer/rider (override active)
apps/customer$ npx expo-doctor                    → 21/21 checks passed. No issues detected!
apps/rider$    npx expo-doctor                    → 21/21 checks passed. No issues detected!
apps/customer$ set APP_VARIANT=preview & npx expo config --type public
   → name: 'TrustLink (preview)' · package: 'com.qafam.trustlink.preview' · versionCode: 1
     userInterfaceStyle: 'automatic' · scheme: 'trustlink' · version: '1.0.0'
   (default/unset) → name: 'TrustLink' · package: 'com.qafam.trustlink'
apps/customer$ npm run typecheck                  → clean
apps/customer$ npx expo export --platform android → Bundled 12130ms (1562 modules) · Exported
apps/rider$    npm run typecheck                  → clean
apps/rider$    npx expo export --platform android → Bundled 15573ms (1506 modules) · Exported
apps/admin$    npm run build                      → ✓ 92 modules · dist 557.24 kB JS (gzip 156.38) / 12.93 kB CSS · built in 669ms
apps/admin$    npm run lint                       → Found 5 warnings and 0 errors.
apps/shared$   npm test (via workspace)           → Test Files 15 passed (15) · Tests 151 passed (151)
apps/shared$   npm run typecheck                  → clean
apps/shared$   node scripts/contrast-check.mjs    → ALL CHECKS PASSED
```

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| Root `package.json` (private, `workspaces: ["apps/*"]`, single lockfile) | ✓ | `package.json` + one `package-lock.json` at the root; the four per-app lockfiles deleted |
| `file:../shared` replaced by the workspace dependency | ✓ | `"@trustlink/shared": "*"` in both apps; `node_modules/@trustlink/shared` is the workspace link |
| Metro keeps working / no duplicate react-native | ✓ | `npm ls react-native` fully deduped; both apps bundle (1562 / 1506 modules); `metro.config.js` points at the repo root |
| Direct `expo-modules-core` removed if safe | ✓ | No `expo-modules-core` import in any app source; doctor's finding gone |
| expo-doctor 21/21 except brand-asset findings | ✓ (exceeded) | **21/21, "No issues detected"** in both apps |
| `userInterfaceStyle: "automatic"` | ✓ | Both `app.config.ts`; confirmed by `npx expo config --type public` |
| `app.config.ts` per `APP_VARIANT`, `.preview` suffix for preview | ✓ | `npx expo config` shows `TrustLink (preview)` / `com.qafam.trustlink.preview` vs `TrustLink` / `com.qafam.trustlink` |
| `eas.json` has preview (apk, mock), preview-api (apk, api), production (aab, api) | ✓ | Both apps; each profile also sets `APP_VARIANT` |
| About version from `expo-constants` | ✓ | `appInfo.ts` imports `expo-constants`; `Constants.expoConfig?.version` |
| BUILD.md updated for building from the repo root | ✓ | `docs/release/BUILD.md` §2/§5 (root install, app-dir EAS commands, workspace detection) |
| SC-45 / SC-46 closed in the ledger only when verified | ✓ | Both closed with evidence; SC-44 deliberately stays open |
| Both apps bundle; typecheck/tests pass | ✓ | §5 |
| Workspace install from clean node_modules | ✓ | apps' `node_modules` deleted, single root install succeeded |

## 7. Deviations and why

- **A root `overrides` pin was needed after the first install.** The workspace initially resolved **two** Reacts (19.2.3 nested in the mobile apps, 19.3.1 at the root pulled in by the console's `^19.2.8`), and expo-doctor failed with *"Found duplicates for react"*. Mobile React cannot move (Expo SDK 57 / RN 0.86 pin `19.2.3`), so I pinned the console to 19.2.3 **and** added root `overrides: { react: "19.2.3", "react-dom": "19.2.3" }` for determinism → doctor 21/21. The console's bundle grew (344.75 kB → 557.24 kB) as a result; logged as **SC-48** rather than hidden.
- **`app.config.ts` replaces `app.json`** rather than sitting beside it: a static `app.config.ts` export replaces the JSON entirely, so leaving both would be misleading.
- **`preview` and `preview-api` share the `.preview` package** (only the data source differs). Documented in `BUILD.md` §4: installing one replaces the other.
- **The brand-asset schema finding disappeared** once the config moved to `app.config.ts` (expo-doctor's asset inspection applies to the JSON path). The files themselves are unchanged, so **SC-44 stays open** — this is a false-negative in the tool, not a fix.
- **BUILD.md was moved, not duplicated** (`docs/frontend/BUILD.md` → `docs/release/BUILD.md`), and the references in `HANDOFF.md` §7 and `DEMO.md` §11 were updated. Historical phase reports still cite the old path and were left untouched.
- **Only `expo-constants` was installed** of the five approved packages (see §4).
- **Branch named `fe-phase-19-reproducible-eas-builds`** — the prompt's `fe-phase-fN-short-description` placeholder resolved to the next number after 18B.

## 8. Ledger rows added / "Needs decision"

- **SC-45 — Resolved (Phase 19)**: workspace + single lockfile; shared resolves on the builder.
- **SC-46 — Resolved (Phase 19)**: `userInterfaceStyle: "automatic"` verified.
- **SC-48 — Needs decision**: one React (doctor 21/21) costs the console bundle size (344.75 → 557.24 kB); the alternative is a duplicated React that expo-doctor rejects.
- SC-44 remains open (brand assets are placeholders), SC-47 remains open (unmerged branch chain — now merged to master by the user).

## 9. Scaffolds still present

Unchanged: onboarding slides copy, Demo menu, `__DEV__` Design Gallery, brand-asset placeholders (SC-44).

## 10. Known issues, risks, open questions

- **Console bundle size** grew with the React pin (SC-48) and Vite warns the chunk exceeds 500 kB — worth a follow-up (code-splitting or accepting 19.3.x for the console).
- **Never run `npm install` inside an app directory** — it recreates a nested lockfile and breaks the single-lockfile guarantee.
- `expo-modules-core` now floats on `expo`'s range (resolved to 57.0.23) instead of the previously pinned range; still a single copy and inside SDK 57.
- No build has been executed: the first `eas build` per app still creates the EAS project (writes `extra.eas.projectId`) and a keystore.
- Brand PNGs (SC-44), the real API host, and the `expo-updates`/Sentry/netinfo/image-manipulator wiring are all still outstanding.

## 11. How a human verifies this phase manually

1. From the repo root: `set NODE_ENV=development` then `npm install` → one `package-lock.json`, no per-app lockfiles (`git status` stops showing them).
2. `npm ls react-native` → single deduped version; `npm ls react --depth=0` → one `react@19.2.3` everywhere.
3. `cd apps/customer && npx expo-doctor` (and rider) → **21/21**.
4. `cd apps/customer && set APP_VARIANT=preview && npx expo config --type public` → `TrustLink (preview)` + `com.qafam.trustlink.preview`; unset → `TrustLink` + `com.qafam.trustlink`.
5. `npx expo export --platform android` in both apps (clean bundles) and `npm run build --workspace admin`.
6. `npm test --workspace @trustlink/shared` → 151 tests.
7. Read `docs/release/BUILD.md` and follow §3–§6.

## 12. Proposed commit message and file list

```
chore(build): phase 19 npm workspace and reproducible EAS builds

- workspace: root package.json (private, workspaces ["apps/*"], react override) with a single
  lockfile; @trustlink/shared becomes the workspace dependency and the four per-app lockfiles are
  removed; both metro.config.js files point watchFolders/nodeModulesPaths at the repo root
- config: app.config.ts replaces app.json in both mobile apps and drives name, package and
  userInterfaceStyle:"automatic" from APP_VARIANT; eas.json gains preview (apk/mock),
  preview-api (apk/api) and production (aab/api) profiles, each setting APP_VARIANT
- deps: remove the direct expo-modules-core dependency (unused in source), add expo-constants and
  read the About version from it; pin console react/react-dom to 19.2.3 so the workspace ships one
  React (expo-doctor 21/21 in both apps)
- docs: BUILD.md moves to docs/release/ rewritten for root-based builds and installs; SC-45 and
  SC-46 closed in the ledger, SC-48 opened for the console bundle-size trade-off
```

Files to stage (24 — 6 created, 11 modified, 7 deleted): as listed in §3.

STOPPED. Awaiting approval for the next phase.

---

## 13. Addendum — post-review checks (requested before commit)

**Check 1 — admin bundle with `NODE_ENV` unset / `production`: DONE.**

| Run | Command environment | Modules | JS bundle |
|---|---|---|---|
| Pre-workspace (Phase 18) | global `NODE_ENV=production` | 88 | 344.75 kB |
| Workspace, first measurement | `NODE_ENV=development` in the same shell line as the install | 92 | 557.24 kB |
| **Workspace, `NODE_ENV` unset** | nothing set (inherits the machine's `production`) | 92 | **557.24 kB** |
| **Workspace, `NODE_ENV=production`** | explicit | 92 | **557.24 kB** |

The size does **not** return to ~345 kB, so **SC-48 stays** (with its cause corrected — *not* a `NODE_ENV` artefact). Additional evidence that the bundle is not a development React: reading the emitted chunk with Node reports `bytes 557097 · devReact false` (no `react-dom-client.development` marker).

What the number therefore is: a real consequence of the workspace change — the console moved from React **19.3.1** in its own `node_modules` to the pinned **19.2.3** resolved from the hoisted root, and its module graph went 88 → 92 modules. I could not isolate which four modules account for the ~212 kB without a bundle analysis pass (a `rollup-plugin-visualizer`-style breakdown or per-chunk attribution), which I did not add in this phase — so SC-48 remains the honest place for the decision: accept the larger console chunk for one deterministic React, or let the console keep 19.3.x and fail expo-doctor's duplicate check.

The `NODE_ENV` hygiene line was added to `docs/release/BUILD.md` §1 regardless, because it is a real trap (it is exactly how I first mis-attributed this growth): *"`NODE_ENV=development` is for `npm install` only — never for build/export commands."* The master-rules install notes live in the phase prompts (not in the repo); `README.md` carries the repo-side install note and should get the same line next time it is edited.

**Check 2 — fresh clone + `npm ci` + typecheck + export: NOT COMPLETED.**

A temporary clone of the working tree (`robocopy` excluding `node_modules`, `.git`, `dist`; a `git worktree` alone would lack the untracked `package.json`, `package-lock.json` and `app.config.ts` this phase adds) was created in the session scratchpad, but its root `npm ci` produced no progress for **~30 minutes** (log: `CLONED` only) and was stopped. The most likely cause is npm's install-script approval gate ("3 packages have install scripts not yet covered by allowScripts", `npm approve-scripts --allow-scripts-pending`) blocking a non-interactive shell. Both clone directories were removed and **nothing was committed**, because this check was a precondition.

Next attempt should run `npm ci --ignore-scripts` (or approve the pending scripts first), then typecheck + `npx expo export --platform android` for customer and rider in that clone. Evidence currently standing for the workspace itself: the clean root install performed in this phase (four app `node_modules` deleted, one root lockfile produced), `npm ls react-native` fully deduped, `npm ls react` = one 19.2.3, expo-doctor 21/21 in both apps, and both apps' exports (1562 / 1506 modules).
