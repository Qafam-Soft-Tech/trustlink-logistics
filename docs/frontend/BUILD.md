# TrustLink — Building installable Android builds (EAS)

Testers install an **APK**; we no longer use Expo Go. This document is the whole procedure.
Nothing here is run by CI yet, and no build has been executed from this repository.

---

## 1. Prerequisites (once per machine)

| Need | Why / command |
|---|---|
| Node 20+ and npm | Expo SDK 57 requires it |
| An Expo account | `https://expo.dev/signup` — the builds run on Expo's servers |
| `eas-cli` (global tool) | `npm install --global eas-cli` — **not** a project dependency, so it is not in `package.json` |
| Login | `eas login` (interactive; never commit credentials) |
| A physical Android phone | Android 8+; enable *Install unknown apps* for the browser/files app you download from |
| Android platform tools (optional) | `adb install -r <file>.apk` instead of downloading on the phone |

Two apps, two EAS projects: **`apps/customer`** → `TrustLink` (`com.qafam.trustlink`) and **`apps/rider`** → `TrustLink Rider` (`com.qafam.trustlink.rider`). `slug` (`customer`, `rider`) is the EAS project name — renaming a slug later means a new EAS project, so leave it.

## 2. Environment per profile — this is the important part

`.env` files are **git-ignored and are not uploaded to EAS**, so they do not exist on the build server. Every build-time value therefore comes from `eas.json` → `build.<profile>.env` (checked into git, no secrets in it).

| Profile | Data source | What it is for | Artifact |
|---|---|---|---|
| `preview` | `EXPO_PUBLIC_DATA_SOURCE=mock` | Testers / investor demo — full seeded mock world, no backend needed | `.apk`, internal distribution |
| `production` | `EXPO_PUBLIC_DATA_SOURCE=api` + `EXPO_PUBLIC_API_URL=https://api.trustlink.example` (**placeholder — replace with the real host**) | Real store build against the backend | `.aab` (Play Store bundle) |

- `EXPO_PUBLIC_*` values are **inlined at build time**: switching a tester from mock to live needs a new build, not a config toggle.
- Phase 17B made this mandatory: outside development, a build with **no** `EXPO_PUBLIC_DATA_SOURCE` throws at startup instead of silently running mock. `production` can never ship mock.
- While the source is `mock`, all three apps show a gold **“Demo data”** strip — a demo build is visually obvious to a tester.

## 3. Build commands

```bash
# one-time per app (creates the EAS project the first time)
cd apps/customer
eas login
eas build:configure          # optional; eas.json is already committed here

# tester APK (mock data)
eas build --platform android --profile preview

# store build (api)
eas build --platform android --profile production
```

```bash
cd apps/rider
eas build --platform android --profile preview
```

Useful afterwards: `eas build:list` (recent builds) · `eas build:view <id>` · the build page shows a QR code and a download link.
`eas build --platform android --profile preview --local` runs the same build on this machine (needed whenever the cloud builder cannot see `../shared` — see §6).

## 4. Installing the APK on a phone

1. Open the build URL from the terminal/`eas build:list` on the phone, or scan the QR code.
2. Download the `.apk`; when Android asks, allow the browser to install unknown apps.
3. Install and open. The app is standalone — no Metro, no Expo Go, no dev server.
4. Alternative from a computer with the phone plugged in: `adb install -r <downloaded>.apk`.
5. First build of each app creates the EAS project; later builds reuse it (`eas build:list` stays useful to testers).

## 5. Versioning

`app.json` → `expo.version` = `1.0.0` and `eas.json` → `cli.appVersionSource: "local"` means **`android.versionCode` in `app.json` is the Play Store version code**. Bump it (`1` → `2`, …) before every store upload; the tester APK can be rebuilt without bumping.

## 6. First-build risks (read before the first `eas build`)

1. **`@trustlink/shared` is a `file:../shared` dependency.** EAS uploads the *app* directory (`apps/customer`, `apps/rider`), and `../shared` is outside it, so the cloud builder's `npm install` cannot resolve it and the first cloud build is expected to fail there.
   - Workaround today: `eas build --local` (the sibling folder is on disk).
   - Proper fix (needs approval): make the repo an npm workspace (root `package.json` with `"workspaces": ["apps/*"]` + one root lockfile) so EAS detects the monorepo and uploads the root. Tracked as **SC-45**.
2. **Placeholder brand assets.** The icon/adaptive-icon/splash files are still the template placeholders and their content is JPEG mislabeled as `.png` (expo-doctor reports it — SC-44). Replace them with real PNGs of the documented sizes (icon 1024×1024; adaptive foreground/background/monochrome 1024×1024; splash icon ~1024×1024) in `assets/brand/`, then point `app.json` at those paths. Registered in `SCAFFOLD_REGISTER.md`.
3. **Android permissions come from the plugins.** The rider app declares `expo-image-picker` with camera/photos Strings for KYC + proof-of-delivery, and `microphonePermission: false` so no `RECORD_AUDIO` is added. The customer app has no camera/photo plugin at all.
4. **`__DEV__`-only tooling does not ship**: the Design Gallery screen is `__DEV__`-gated, so a release bundle cannot reach it.
5. **No secrets anywhere**: `eas.json` has no tokens or keys; the production API URL is an obvious placeholder; nothing needs an `.env` file to build (env comes from the profile). Never add an API key to `EXPO_PUBLIC_*` — those values end up inside the app bundle.

## 7. Resetting demo state on a tester device

| App | Reset |
|---|---|
| Customer | Demo menu (long-press the version text on Welcome/Account) → pick a scenario, **Reset**, or use **Advance** to move a delivery along |
| Rider | Relaunch the app (the mock is rebuilt at start); **Sign out** to change persona |
| Admin (web) | Avatar menu → **Reset demo data** |

Seed credentials are in `DEMO.md` §7 (customer `08031234567` / `482913`; rider `08050000001`; console `admin@trustlink.ng` / `trustlink-demo`).

## 8. Not covered here

- **iOS**: no `ios.bundleIdentifier` and no Apple credentials — Android only for R1.
- **Store submission** (`eas submit`): the `submit.production` block is intentionally empty; no Play Store service-account key exists yet.
- **CI**: builds are run manually; nothing in the repo triggers them.
