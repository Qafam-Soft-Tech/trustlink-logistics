# TrustLink — Building and installing Android builds (repo root)

Testers install an **APK**; local development uses **Expo Go SDK 58**. This is the whole procedure.
Local production checks have run: the backend Docker image builds and starts healthy, and both Android bundles export on SDK 58. The first `eas build` is still a human step because it needs the Expo/EAS account.

---

## 1. Prerequisites (once per machine)

| Need | Command / note |
|---|---|
| Node 20+ and npm | The repo is a **single npm workspace** — always install from the repo root |
| Expo SDK 58 | Local development uses **Expo Go for SDK 58**; installable builds use EAS |
| Expo account | expo.dev/signup |
| `eas-cli` | `npm install --global eas-cli` (a global tool, **not** a project dependency) |
| Login | `eas login` — never commit credentials; `EXPO_TOKEN` is for non-interactive shells only |
| Android phone | Android 8+; allow *Install unknown apps* for the app you download with |
| Optional | `adb install -r <file>.apk` (Android platform tools) |

**This machine only:** the shell exports `NODE_ENV=production` globally, which prunes devDependencies, so run installs with `set NODE_ENV=development` (cmd) or `$env:NODE_ENV='development'` (PowerShell).

**`NODE_ENV=development` is for `npm install` only — never for build/export commands.** It changes which React build gets bundled (development React is far larger) and flips `import.meta.env.PROD`, so any measurement taken in that shell is wrong. Run `npm run build`, `npx expo export` and `eas build` with `NODE_ENV` unset (or `production`).

## 2. Install (repo root, single lockfile)

```bash
cd "C:\Users\Qafams\Desktop\TrustLink Logistics"
set NODE_ENV=development
npm install                      # one root package-lock.json, one hoisted node_modules
```

- `apps/*` are npm workspaces; `@trustlink/shared` is consumed as the workspace dependency `"*"` and resolves to `node_modules/@trustlink/shared` (a symlink), **not** to a copied folder — this is what closed SC-45.
- Useful root scripts: `npm test --workspace @trustlink/shared` · `npm run typecheck --workspace @trustlink/shared` · `npm run build --workspace admin`.
- Do not run `npm install` inside an app directory: it re-creates a nested lockfile and breaks the single-lockfile guarantee.

## 3. Local development

```bash
cd apps/customer && npx expo start -c        # Metro (Expo Go SDK 58); use -c after shared/ changes
cd apps/rider    && npx expo start -c        # second app takes port 8082
cd apps/admin    && npm run dev              # Vite console (add -- --host to open it from a phone)
```

## 4. Build profiles (eas.json, per app)

`APP_VARIANT` is set by the profile and read by `app.config.ts`; `EXPO_PUBLIC_*` values are inlined at build time. `.env` files are git-ignored and are **not** uploaded to EAS, so every build-time value must live in `eas.json` → `build.<profile>.env`.

| Profile | APP_VARIANT | Package | Name | Data source | Artifact |
|---|---|---|---|---|---|
| `preview` | `preview` | `com.qafam.trustlink.preview` / `…rider.preview` | “TrustLink (preview)” | `mock` | APK, internal |
| `preview-api` | `preview-api` | same `.preview` package | “TrustLink (preview)” | `api` + `EXPO_PUBLIC_API_URL` | APK, internal |
| `production` | `production` | `com.qafam.trustlink` / `com.qafam.trustlink.rider` | “TrustLink” / “TrustLink Rider” | `api` | AAB (Play) |

- The `.preview` suffix lets a tester APK live beside a store install; `preview` and `preview-api` share that package, so installing one replaces the other (their data source is the difference).
- `production` cannot ship mock: it sets `EXPO_PUBLIC_DATA_SOURCE=api`, and a non-development build with no value throws at startup (Phase 17B).
- While the source is mock, every screen shows the gold **Demo data** strip.

## 5. Build commands

`eas build` runs from the **app directory**; EAS CLI detects the workspace root (`package.json` + single root lockfile) and uploads the whole repository, so `@trustlink/shared` resolves on the builder.

```bash
cd apps/customer
eas build --platform android --profile preview        # tester APK (mock)
eas build --platform android --profile preview-api    # tester APK against the API
eas build --platform android --profile production     # Play bundle

cd ../rider
eas build --platform android --profile preview
```

Replace `EXPO_PUBLIC_API_URL` before the first `preview-api` / `production` build. `eas build:list` re-shows build URLs; `eas build:view <id>` shows one build. Add `--local` to build on this machine instead of Expo's servers (Windows: needs WSL2 + Docker).

## 6. Installing the APK

1. Open the build page link (or scan its QR) on the phone → download the `.apk`.
2. Allow the browser/files app to install unknown apps → Install.
3. Play Protect may warn ("Unsafe app blocked") → *Install anyway* (self-signed tester build).
4. "App not installed" usually means a build with a different signing key is present → uninstall the old one first.
5. USB alternative: `adb devices` → `adb install -r "<path>.apk"`.

## 7. Resetting demo state

| App | Reset |
|---|---|
| Customer | Demo menu (long-press the version text on Welcome/Account) → scenario / **Reset** / **Advance** |
| Rider | Relaunch (the mock rebuilds), or sign out to switch persona |
| Admin (web) | Avatar menu → **Reset demo data** |

Credentials: customer `08031234567` / `482913`; rider `08050000001` / `482913`; console `admin@trustlink.ng` / `trustlink-demo` (`DEMO.md` §7).

## 8. Versioning and bundle size

- `app.config.ts` → `expo.version` = `1.0.0`; `eas.json` → `cli.appVersionSource: "local"`, so `android.versionCode` in the same file is the Play version code. Bump it before each store upload.
- The About screen reads the version at runtime through `expo-constants` (`Constants.expoConfig?.version`), so it always matches the installed build.
- Recorded sizes after the SDK 58 upgrade, re-measured with **`NODE_ENV` unset**: customer **1664 modules**, rider **1599 modules**, admin `412.47 kB` JS / `12.93 kB` CSS (126.32 kB gzip). Re-measure with `npx expo export --platform android` (mobile) and `npm run build --workspace admin`, never from a shell that has `NODE_ENV=development` set (see §1).
- SDK 57 installable builds are **incompatible** with this SDK 58 JS bundle. Rebuild the preview APK and production AAB after pulling this branch.

## 9. First-build risks

1. **MVP brand assets are generated monograms** (valid 1024×1024 PNGs); expo-doctor passes. Replace them with the designer's final brand PNGs in `assets/` before store submission if a different mark is required.
2. **`props.nodeModulesPaths`/hoisting**: dev builds rely on the root `node_modules`; always `npm install` from the root after pulling.
3. **`eas.json` env is public** — never put a secret in `EXPO_PUBLIC_*`.
4. **First EAS run per app** asks to create the project (writes `extra.eas.projectId` into the config — commit it) and to generate an Android keystore (keep it in EAS).
5. **iOS is out of scope** (no bundle id / Apple credentials) and `submit.production` is intentionally empty (no Play service account).

## 10. Not covered here

`expo-updates`/OTA releases, Sentry, and the api-mode end-to-end run: the packages are approved but not wired yet — each gets its own phase.
