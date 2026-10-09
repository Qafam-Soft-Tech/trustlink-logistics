# Phase 18 — Installable builds (EAS)

Branch: `fe-phase-18-installable-builds` (from `fe-phase-17b-demo-fixes` @ `f398832` — see §7)
Scope: build configuration + docs only. No backend changes, no new dependencies, no EAS run.

---

## 1. Inspection findings (before changes)

- **Branch provenance conflict.** The prompt says "from **master**", but `master` is the **backend** branch (`eb23529` — backend work), there is no `main`, and the whole frontend (phases 0–17B) exists only on the unmerged `fe-phase-*` branches. Branching from `master` would have thrown away 18 phases, so I used the master-rules path (previous phase's branch + clean tree) and logged **SC-47**.
- **`app.json` (both apps) is still the bare Expo template**: `name` was the technical `customer` / `rider` (this is the **device display name**), no `android.package`, no `android.versionCode`, both apps on `scheme: "trustlink"`. `version` was already `1.0.0`; plugins: customer `expo-secure-store`, `expo-splash-screen`, `expo-sharing`; rider `expo-splash-screen`, `expo-secure-store`.
- **No `babel.config.js` in either app** (only `metro.config.js`). The worklets transform is therefore provided by the default `babel-preset-expo`, which resolves `react-native-worklets/plugin` itself — evidence: `node_modules/babel-preset-expo/build/configs/expo.js:98` (`resolveModule(api, 'react-native-worklets/plugin')`) and the `reanimated`/`worklets` preset options in `build/index.js:141-142`.
- **`expo-image-picker` is rider-only** and used in four places — `screens/kyc/KycFormScreen.tsx` (camera + library) and `screens/jobs/PodScreen.tsx` (camera + library) — but **no permission strings were configured**, so a release build would ship Android's defaults with no user-facing rationale.
- **`GestureHandlerRootView` wraps both apps** (`apps/customer/App.tsx:44`, `apps/rider/App.tsx:41`) → OK for release.
- **Linking**: customer `scheme: "trustlink"` with `prefixes: [createURL('/'), 'trustlink://']` in `AppNavigator`; the rider has **no linking config at all** (only `Linking.openURL` for `tel:` / maps), so changing its scheme had no prefixes to update.
- **Assets are placeholders with wrong content**: `assets/icon.png` and friends are **JPEG data with a `.png` extension** (expo-doctor config-schema failure). `assets/brand/` does not exist.
- **`expo-modules-core` is a direct dependency** in both `package.json`s (introduced by the SDK 57 `expo install --fix` alignment) — expo-doctor flags it as "should not be installed directly".
- **Nothing in the repo referenced EAS**: no `eas.json`, no `BUILD.md`.

## 2. Summary (≤5 lines)

- Both `app.json`s now carry the final identity: **TrustLink** / **TrustLink Rider**, `com.qafam.trustlink` / `com.qafam.trustlink.rider`, `versionCode 1`, schemes `trustlink` / `trustlink-rider`; the rider declares image-picker permission strings (with `microphonePermission: false`).
- `eas.json` added to both apps: **`preview`** = internal APK with `EXPO_PUBLIC_DATA_SOURCE=mock`, **`production`** = app-bundle with `EXPO_PUBLIC_DATA_SOURCE=api` + an obvious `EXPO_PUBLIC_API_URL` placeholder; no secrets anywhere.
- Native/permission audit for release: gesture-handler root view and the worklets babel plugin **OK**; image-picker strings **fixed**; assets and `expo-modules-core` **reported, not fixed** (SC-44, §7).
- `expo-doctor` **19/21** in both apps, `expo install --check` "Dependencies are up to date" in both; the two doctor failures are reported with evidence and reasons.
- New `docs/frontend/BUILD.md` documents prerequisites, exact commands, per-profile env, APK install, demo resets and first-build risks (incl. `file:../shared` → SC-45).

## 3. Files created / modified / deleted

**Created (4)**
| Path | Why |
|---|---|
| `apps/customer/eas.json` | Preview (apk/mock) + production (aab/api) profiles |
| `apps/rider/eas.json` | Same profiles for the rider app |
| `docs/frontend/BUILD.md` | The complete build/install/demo-reset procedure + risks |
| `docs/frontend/reports/PHASE-18-REPORT.md` | This report |

**Modified (6)**
| Path | Why |
|---|---|
| `apps/customer/app.json` | Display name `TrustLink`, `android.package`, `versionCode 1` |
| `apps/rider/app.json` | Display name `TrustLink Rider`, `android.package`, `versionCode 1`, scheme `trustlink-rider`, image-picker plugin with permission strings |
| `docs/frontend/CONTRACT_LEDGER.md` | SC-44…SC-47 + §D items 23–25 |
| `docs/frontend/HANDOFF.md` | §7: EAS builds must set the data source via `eas.json` env (`.env` is not uploaded) |
| `docs/frontend/DEMO.md` | §11: same statement for testers |
| `docs/frontend/SCAFFOLD_REGISTER.md` | Two rows: brand assets (customer, rider) are placeholders to be replaced from `assets/brand/` |

**Deleted (0) — Total: 10 (4 created, 6 modified)**

## 4. Dependencies added

**none.** `eas-cli` is a global tool (`npm install --global eas-cli`), deliberately not a project dependency; no package.json dependency changed.

## 5. Commands run with real output

```
$ node -e "…JSON.parse…"                  → valid JSON: apps/customer/app.json · apps/customer/eas.json ·
                                             apps/rider/app.json · apps/rider/eas.json

apps/customer$ npx expo-doctor            → Running 21 checks… 19/21 checks passed. 2 checks failed.
  ✖ Check Expo config (app.json/app.config.js) schema
      icon / adaptiveIcon.foregroundImage|monochromeImage|backgroundImage: extension .png but content is jpg
  ✖ Check dependencies for packages that should not be installed directly
      The package "expo-modules-core" should not be installed directly…
apps/customer$ npx expo install --check   → Dependencies are up to date
apps/rider$    npx expo-doctor            → 19/21 checks passed. 2 checks failed (identical two)
apps/rider$    npx expo install --check   → Dependencies are up to date

apps/shared$   npm run typecheck          → clean
apps/shared$   npm test                   → Test Files 15 passed (15) · Tests 151 passed (151)
apps/shared$   node scripts/contrast-check.mjs → ALL CHECKS PASSED
apps/customer$ npx tsc --noEmit -p .      → clean
apps/customer$ npx expo export --platform android → Bundled 13106ms (1566 modules) · Exported
apps/rider$    npx tsc --noEmit -p .      → clean
apps/rider$    npx expo export --platform android → Bundled 11977ms (1510 modules) · Exported
apps/admin$    npm run build              → ✓ 88 modules transformed · built in 592ms
apps/admin$    npm run lint               → Found 5 warnings and 0 errors.
```

`eas build` was **not** run (explicitly out of scope) and no Expo login was performed.

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| Valid `app.json` in both apps | ✓ | JSON parses; expo-doctor's schema check passes everything **except** the pre-existing asset content (SC-44) — `package`, `versionCode`, `scheme`, plugin config all accepted |
| Valid `eas.json` in both apps | ✓ | JSON parses; `cli.appVersionSource: local` matches `versionCode` in `app.json`; profiles `preview` + `production` only |
| `preview` forces mock | ✓ | `apps/*/eas.json` → `build.preview.env.EXPO_PUBLIC_DATA_SOURCE: "mock"` (+ `distribution: internal`, `android.buildType: apk`) |
| `production` cannot ship mock | ✓ | `build.production.env.EXPO_PUBLIC_DATA_SOURCE: "api"` — it is the **only** source value in that profile, and Phase 17B makes a missing value throw at startup, so mock cannot be reached |
| No secrets in any file | ✓ | `eas.json` contains only profile names, build types and the mock/api flags + a `*.example` URL; no tokens, keys or `.env` values |
| `BUILD.md` exists | ✓ | `docs/frontend/BUILD.md` — prerequisites, commands, per-profile env, APK install, versioning, demo resets, first-build risks |
| Placeholder brand assets listed in the scaffold register | ✓ | Two rows ("Brand assets (customer)"/"(rider)") marked **Replaced by brand assets**, with the required PNG sizes |
| `expo-doctor` + `expo install --check` run in both apps | ✓ | 19/21 both; "Dependencies are up to date" both (§5) |
| Native/permission audit for release | ✓ | §7 table: 2 OK, 1 fixed, 2 reported |
| Backend untouched, no new dependencies, no `eas build` | ✓ | Diff touches only the two apps' config + docs; `git status` shows no backend path |

## 7. Deviations and why

**Native module / permission audit for release builds**

| Module | Verdict | Evidence |
|---|---|---|
| `react-native-gesture-handler` | **OK** | `GestureHandlerRootView` at the root of both apps (`customer/App.tsx:44`, `rider/App.tsx:41`); no config plugin needed |
| Reanimated 4 / `react-native-worklets` babel plugin | **OK** | No `babel.config.js` in either app → the default `babel-preset-expo` supplies it (`babel-preset-expo/build/configs/expo.js:98` resolves `react-native-worklets/plugin`); the android export bundles cleanly and Phase 16 motion runs in Expo Go |
| `expo-image-picker` (rider) | **Fixed** | Plugin added to `rider/app.json` with `photosPermission` + `cameraPermission` strings and `microphonePermission: false` (so no `RECORD_AUDIO`); used by `KycFormScreen` and `PodScreen` for camera + library |
| `expo-secure-store` | **OK** | Plugin listed in both apps; used for the session token |
| `expo-linking` (customer) | **OK** | `scheme: "trustlink"` + prefixes `[createURL('/'), 'trustlink://']`; rider keeps `trustlink-rider` with no linking config (only `tel:`/maps via `Linking.openURL`) |
| `expo-print` (customer) | **OK** | No config plugin exists; autolinked. Used for receipt PDFs |
| `expo-sharing` (customer) | **OK** | Plugin listed in `customer/app.json` |
| Icon/adaptive-icon/splash assets | **Needs decision (SC-44)** | Content is JPEG with a `.png` extension → expo-doctor schema failure. **Not changed**: the phase says "until then keep the current ones"; they are registered as replaced by brand assets |
| `expo-modules-core` direct dependency | **Reported, not fixed (SC-44-adjacent)** | Doctor's "should not be installed directly"; it arrived with the SDK 57 `expo install --fix` alignment that fixed the worklets crash. Removing it changes the lockfile and the alignment that we deliberately pinned, so I did not touch it. Fix if wanted: `npm uninstall expo-modules-core` in both apps, then re-run `expo install --check` |
| Android permissions overall | **OK** | No map/location/push plugin exists; the only runtime permissions come from image-picker (rider) and are user-facing now |

**Other deviations**

- **Branched from `fe-phase-17b-demo-fixes`, not `master`** (SC-47) — the only option that preserves phases 0–17B. Honouring "from master" requires a human merge first.
- **`userInterfaceStyle` left at `"light"`** — flagged as **SC-46** rather than changed: setting `"automatic"` alters native chrome/splash behaviour across both apps, which is a design decision, not a build fix.
- **`EXPO_PUBLIC_API_URL` is `https://api.trustlink.example`** — RFC 2606 reserves `.example`, so it cannot be mistaken for a real host. It must be replaced before the first production build.
- **Slug unchanged** (`customer`, `rider`) — EAS derives the project name from the slug; changing it creates a new EAS project, and the phase only asked for display names.
- **No `ios.bundleIdentifier`** — the phase is Android/APK only.

## 8. Ledger rows added / "Needs decision"

- **SC-44** — brand assets must be supplied as real PNGs (`assets/brand/`), then `app.json` paths updated; the committed files are placeholders whose content is JPEG.
- **SC-45** — `@trustlink/shared` is `file:../shared`; EAS cloud builders only receive the app directory, so a cloud build is expected to fail there (`eas build --local` works today). Fix = root npm workspace.
- **SC-46** — `userInterfaceStyle: "light"` prevents "System" appearance from following the device in release builds.
- **SC-47** — the prompt's "branch from master" conflicts with the repo (`master` = backend, frontend unmerged); branched from the previous phase instead.

## 9. Scaffolds still present

- Onboarding "Slides" copy, Demo menu, `__DEV__` Design Gallery — all **justified** (unchanged).
- **New:** brand assets (icon / adaptive-icon / splash / favicon) in both apps — **placeholder**, marked "replaced by brand assets" (SC-44).

## 10. Known issues, risks, open questions

- **First cloud build is expected to fail** on `file:../shared` (SC-45) — use `eas build --local`, or approve a root workspace.
- **Icons/splash will be rejected or rendered badly** until real PNGs replace the JPEG-in-`.png` placeholders (SC-44).
- **`eas.json` env is public**: `EXPO_PUBLIC_*` values are inlined into the bundle, so no secret may ever be added there.
- No Play Store submission key exists (`submit.production` is empty); iOS is out of scope.
- `expo-modules-core` remains a direct dependency (doctor warning).
- Tester devices need "install unknown apps" allowed; the internal APK is not distributed via Play.

## 11. How a human verifies this phase manually

1. `node -e "…JSON.parse…"` on both `app.json` + `eas.json` files (or read them): names, packages, `versionCode 1`, schemes, and the two env blocks.
2. Confirm `preview.env.EXPO_PUBLIC_DATA_SOURCE === "mock"` and `production.env.EXPO_PUBLIC_DATA_SOURCE === "api"` in both `eas.json`s, and that neither file contains a secret.
3. `cd apps/customer && npx expo-doctor` and `cd apps/rider && npx expo-doctor` → 19/21 with only the asset-content and `expo-modules-core` findings.
4. `cd apps/customer && npx expo install --check` (and rider) → "Dependencies are up to date".
5. Read `BUILD.md` and follow §3 with a real Expo account: `eas login`, `eas build --platform android --profile preview` (from `apps/customer`, add `--local` if the shared-dependency upload fails), install the APK from the build URL/QR on an Android phone, and confirm the gold **Demo data** strip is visible.
6. On the installed app: sign in `08031234567` / `482913`, run `DEMO.md` §8 Chapter A, and reset from the Demo menu (§7 of `BUILD.md`).

## 12. Proposed commit message and file list

```
chore(frontend): phase 18 installable android builds

- app.json: display names TrustLink / TrustLink Rider, android packages com.qafam.trustlink and
  com.qafam.trustlink.rider, versionCode 1, rider scheme trustlink-rider, and expo-image-picker
  permission strings (camera/photos, microphone disabled) for release builds
- eas.json: preview profile (internal APK, EXPO_PUBLIC_DATA_SOURCE=mock) and production profile
  (app-bundle, EXPO_PUBLIC_DATA_SOURCE=api + EXPO_PUBLIC_API_URL placeholder) in both apps, no secrets
- docs: BUILD.md (prerequisites, commands, per-profile env, installing the APK, demo resets,
  first-build risks incl. the file:../shared dependency); HANDOFF §7 and DEMO §11 record that EAS
  builds must set the data source through eas.json env because .env files are not uploaded;
  brand-asset placeholders registered in SCAFFOLD_REGISTER.md; ledger SC-44…SC-47
```

Files to stage (10 — 4 created, 6 modified):
`apps/customer/app.json` · `apps/customer/eas.json` · `apps/rider/app.json` · `apps/rider/eas.json` · `docs/frontend/BUILD.md` · `docs/frontend/CONTRACT_LEDGER.md` · `docs/frontend/DEMO.md` · `docs/frontend/HANDOFF.md` · `docs/frontend/SCAFFOLD_REGISTER.md` · `docs/frontend/reports/PHASE-18-REPORT.md`

STOPPED. Awaiting approval for the next phase.
