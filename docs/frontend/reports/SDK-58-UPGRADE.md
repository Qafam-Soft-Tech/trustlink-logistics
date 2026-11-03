# Expo SDK 58 upgrade

**Branch:** `fe-sdk-58-upgrade` (from `mvp-m4-admin-api` @ `69ab011`)
**Scope:** customer app, rider app, shared package, admin workspace pins.

---

## 1. Summary (≤5 lines)

- Both mobile apps moved from SDK 57 to **SDK 58**: React Native **0.88.1**, React **19.3.0**, Expo modules **58.x**.
- The workspace now resolves **one** React and **one** React Native at the root, so `@trustlink/shared` and both apps bundle the same runtime.
- RN 0.88 dropped the `Clipboard` type export, so the customer app uses **`expo-clipboard`**.
- RN 0.88 changed ref typing and `RefreshControl.onRefresh`; both are fixed across the shared components and rider screens.
- Validation: **expo-doctor 20/20 on both apps**, typecheck clean, shared 151 tests, backend 143 tests, admin build, and Android exports for both apps.

---

## 2. Version matrix (installed and verified)

| Package | Before | After |
|---|---|---|
| `expo` | 57.0.27 | **58.0.22** |
| `react` / `react-dom` | 19.2.3 | **19.3.0** |
| `react-native` | 0.86.3 | **0.88.1** |
| `react-native-gesture-handler` | 2.32 | **3.3.0** |
| `react-native-reanimated` | 4.5.1 | **4.7.1** |
| `react-native-worklets` | 0.10.1 | **0.13.0** |
| `react-native-safe-area-context` | 5.7.0 | **5.10.1** |
| `react-native-screens` | 4.26.0 | **4.30.1** |
| `expo-*` modules | 57.x | **58.x** |
| `expo-clipboard` | — | **58.0.4** |
| `@types/react` / `@types/react-dom` | 19.2.x | **19.3.0** |

`npx expo install --check` reports **Dependencies are up to date** in both apps.

---

## 3. Code changes

- `apps/customer/src/utils/clipboard.ts` — replaced RN core `Clipboard.setString` with `expo-clipboard`'s `setStringAsync` (RN 0.88 removed the core type export).
- `apps/shared/src/components/primitives.tsx` / `layout.tsx` — `forwardRef` generics now use `React.ComponentRef<typeof View | RNText | TouchableOpacity | TextInput | ScrollView>`, matching RN 0.88's host-component ref typing.
- `apps/customer/src/screens/AlertsScreen.tsx` and rider `AlertsScreen`, `JobsScreen`, `JobDetailsScreen`, `ExecutionScreen` — `RefreshControl.onRefresh` now wraps `refetch()` in a void block because RN 0.88 requires `() => void | Promise<void>`.
- `apps/shared/package.json` — declares `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`, and `react-native-safe-area-context` as peers/dev dependencies so the shared package resolves them from the workspace root.
- Root `package.json` — one `overrides` block pins React 19.3.0, React DOM 19.3.0, RN 0.88.1, Reanimated 4.7.1, worklets 0.13.0, gesture-handler 3.3.0, safe-area-context 5.10.1, screens 4.30.1.
- Both mobile `package.json` files and the admin `package.json` moved to React 19.3.0 / matching types.
- `package-lock.json` regenerated; `npm ci --dry-run` reports **up to date**.

No backend code changed. Backend build and all 143 unit tests still pass.

---

## 4. Verification

```
apps/customer$ npx expo-doctor                 → 20/20 checks passed
apps/rider$    npx expo-doctor                 → 20/20 checks passed
apps/*$        npx expo install --check        → Dependencies are up to date
root$          npm run typecheck               → customer, rider, shared clean
root$          npm test --workspace @trustlink/shared → 151/151 passed
root$          npm run build --workspace admin → 412.47 kB JS (126.32 kB gzip)
apps/customer$ npx expo export --platform android → 1664 modules, exported
apps/rider$    npx expo export --platform android → 1599 modules, exported
backend$       npm run build / test:unit       → clean / 143 passed
```

The backend's local `oxlint` native binary is currently blocked by a Windows Application Control policy; linting the backend with the root `oxlint` binary reports **0 warnings / 0 errors**. This is a machine policy issue, not a code issue; CI on Linux uses the backend binary normally.

---

## 5. What this means for testing and deployment

- **Expo Go 58 on your phone now matches the project.** Run `npx expo start -c` in `apps/customer` and `apps/rider`; no SDK 57 APK is needed.
- **Existing SDK 57 APKs are incompatible** with this JS bundle. Any installable tester or store build must be rebuilt from this branch.
- `eas.json` profiles are unchanged; EAS will install the new lockfile and build against SDK 58.
- Rebuild the customer and rider APKs/AABs before distributing. The first EAS build after an SDK upgrade also regenerates native projects, so allow extra time.
- Brand assets are still placeholders (SC-44); expo-doctor passes, but replace them with real PNGs before store submission.
- iOS remains out of scope until a bundle identifier and Apple Developer credentials are added.

---

## 6. Proposed commit message

```
chore(mobile): upgrade customer and rider apps to expo sdk 58

- move to Expo 58, React Native 0.88.1, React 19.3.0 and the matching
  gesture-handler/reanimated/worklets/safe-area/screens versions
- pin one React and one React Native for the whole workspace; declare the
  shared package's native peers so @trustlink/shared resolves the root copies
- replace RN core Clipboard with expo-clipboard
- update forwardRef generics and RefreshControl.onRefresh for RN 0.88
- verify doctor 20/20, typecheck, 151 shared tests, 143 backend tests,
  admin build, and both Android exports

Co-authored-by: CommandCodeBot <noreply@commandcode.ai>
```
