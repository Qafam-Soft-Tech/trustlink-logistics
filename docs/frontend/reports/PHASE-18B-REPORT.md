# Phase 18B — Sheet gesture root + rider route names (dev-run fixes)

Branch: `fe-phase-18-installable-builds` (continues after commit `945aac9`)
Trigger: `npx expo start -c` output the user pasted — one runtime **ERROR** in the customer app and three **WARN**s in the rider app. Both are pre-existing frontend defects surfaced by the dev run; neither is caused by the Phase 18 build config.

---

## 1. Inspection findings (before changes)

- **Customer `ERROR [GestureDetector must be used as a descendant of GestureHandlerRootView]`.** The only `GestureDetector` in the whole frontend is `apps/shared/src/components/feedback.tsx:191` inside the **`BottomSheet`**, and it sits inside a React Native `<Modal>` (line 188). A `Modal` renders in its **own native root**, so the app-level `GestureHandlerRootView` (`apps/customer/App.tsx:44`, `apps/rider/App.tsx:41`) cannot cover it — gesture-handler throws exactly this on Android. `Dialog` uses no gestures, so it is unaffected. Introduced by the Phase 16 feedback rebuild; drag-to-dismiss would silently have been dead in a release build.
- **Rider `WARN Found screens with the same name nested inside one another: Main > Jobs, Main > Jobs > Jobs`** (and the same for `Alerts`, `Profile`). The tab routes are `Home | Jobs | Alerts | Profile` (`MainTabs`, `AppNavigator.tsx:112–115`) and each nested stack's first screen reused the parent's name (`JobsStack.Screen name="Jobs"`, `AlertsStack.Screen name="Alerts"`, `ProfileStack.Screen name="Profile"`). Only `Home`/`HomeFeed` was already unique — which is why the warning listed three of four tabs.
- **References to the duplicate names**: typed via `NativeStackScreenProps<…, 'Jobs'>` (`JobsScreen.tsx:10`) and `<…, 'Profile'>` (`ProfileScreen.tsx:9`), plus the param lists in `navigation/types.ts`. Tab-targeted calls (`HomeScreen.tsx:49/61/155/159`, e.g. `navigate('Main', { screen: 'Jobs' })`) refer to the **tab**, not the inner screen, so they are unaffected by renaming the inner routes.
- Everything else about the two runs was healthy (both apps bundled; the `1639/1695` dev module counts are the dev-only modules such as LogBox, versus `1510/1566` in a production export).

## 2. Summary (≤5 lines)

- The customer gesture error is fixed by giving the bottom sheet's modal content **its own `GestureHandlerRootView`** — gestures inside a `Modal` are no longer outside the gesture root, so drag-to-dismiss (and any other modal gesture) works.
- The rider warning is fixed by making nested route names unique: `Jobs → JobsList`, `Alerts → AlertsFeed`, `Profile → ProfileHome`, with the param lists and screen prop types updated. **Tab route names are unchanged**, so all existing navigation calls and deep links behave identically.
- No behaviour, no visual design, no dependency and no backend change; 5 source files.
- Full regression green: shared typecheck + **151 tests** + contrast; customer and rider typecheck + bundles; admin build + lint.
- Restart Metro with `-c` in each app to pick the changes up.

## 3. Files created / modified / deleted

**Created (1)**: `docs/frontend/reports/PHASE-18B-REPORT.md` (this report).
**Modified (5)**
| Path | Why |
|---|---|
| `apps/shared/src/components/feedback.tsx` | Import + wrap the `BottomSheet` modal content in `GestureHandlerRootView` (`styles.root`), with a comment explaining why |
| `apps/rider/src/navigation/AppNavigator.tsx` | Distinct inner screen names: `JobsList`, `AlertsFeed`, `ProfileHome` |
| `apps/rider/src/navigation/types.ts` | Same three keys renamed in `JobsStackParamList` / `AlertsStackParamList` / `ProfileStackParamList` |
| `apps/rider/src/screens/JobsScreen.tsx` | `NativeStackScreenProps<…, 'JobsList'>` |
| `apps/rider/src/screens/ProfileScreen.tsx` | `NativeStackScreenProps<…, 'ProfileHome'>` |

**Deleted (0) — Total: 6 (1 created, 5 modified)**

## 4. Dependencies added

none.

## 5. Commands run with real output

```
apps/shared$   npm run typecheck  → clean
apps/shared$   npm test           → Test Files 15 passed (15) · Tests 151 passed (151)
apps/shared$   node scripts/contrast-check.mjs → ALL CHECKS PASSED
apps/customer$ npx tsc --noEmit -p . → clean
apps/customer$ npx expo export --platform android → Bundled 83759ms (1566 modules) · Exported
apps/rider$    npx tsc --noEmit -p . → clean   (first pass caught 4 stale route references — see §7)
apps/rider$    npx expo export --platform android → Bundled 16496ms (1510 modules) · Exported
apps/admin$    npm run build      → ✓ 88 modules transformed · built in 2.51s
apps/admin$    npm run lint       → Found 5 warnings and 0 errors.
```

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| Customer gesture error root-caused | ✓ | Single `GestureDetector` = `feedback.tsx:191`, inside `<Modal>` (line 188) → outside the app-level gesture root |
| Error fixed | ✓ | `<GestureHandlerRootView style={styles.root}>` now wraps the sheet's modal content; `styles.root = { flex: 1 }`; bundles clean in both apps |
| Rider duplicate-name warning fixed for all three tabs | ✓ | Inner screens renamed to `JobsList` / `AlertsFeed` / `ProfileHome`; `Main > Jobs` no longer contains `Jobs` |
| No navigation regression | ✓ | Tab route names (`Home/Jobs/Alerts/Profile`) untouched; tab-targeted `navigate('Main', { screen: 'Jobs' })` calls still valid (grep) and the full typecheck is clean |
| No stale typed references | ✓ | The first rider typecheck failed with **4** errors (`Jobs`/`Profile` route names) → fixed in `JobsScreen.tsx`, `ProfileScreen.tsx`; second pass clean |
| Full regression | ✓ | §5 |
| Behaviour/design untouched | ✓ | Only route names + one modal wrapper changed; no visual or copy change |

## 7. Deviations and why

- **Renamed the inner stack screens rather than the tabs.** The warning is about the *inner* name colliding with the parent; renaming the tabs would have invalidated every `navigate('Main', { screen: 'Jobs' })` call and the tab bar mapping. Renaming the inner routes touched 5 files and the compiler proved there were no remaining typed references.
- **The typecheck is the safety net**: the first run failed on 4 references (`AppNavigator.tsx:80/101`, `JobsScreen.tsx:10`, `ProfileScreen.tsx:9`), which is exactly the evidence that the rename was complete — no runtime-only references remained (the broader grep for `screen: 'Jobs'|'Alerts'|'Profile'` returns only tab-targeted calls).
- **Wrapped only the sheet, not the dialog** — the dialog uses no gesture, so adding a root there would be unnecessary structure.
- **These are pre-existing bugs, not Phase 18 regressions**: the sheet dates from Phase 16 (motion rebuild) and the route names from Phase 12/13. They were invisible in a production export (no runtime), which is why the dev run surfaced them.
- **No change to the earlier Phase 18 commit** — this fix-up is a separate commit on the same branch.

## 8. Ledger rows added / "Needs decision"

none — both items were defects with an unambiguous fix (no requirement conflict).

## 9. Scaffolds still present

Unchanged (onboarding slides copy, Demo menu, `__DEV__` Design Gallery, brand-asset placeholders).

## 10. Known issues, risks, open questions

- The rider app must be restarted with `npx expo start -c` (Metro caches the shared bundle) to see the fixes.
- Both dev servers cannot share port 8081: the second app offers 8082 — that is normal, not a defect.
- Remaining Phase 18 items are unchanged: **SC-44** (brand PNGs), **SC-45** (`file:../shared` vs EAS), **SC-46** (`userInterfaceStyle`), **SC-47** (branch provenance).

## 11. How a human verifies this phase manually

1. `cd apps/customer && npx expo start -c`, open in Expo Go, and trigger a bottom sheet (e.g. Account → Sign out confirmation / a filter sheet): **no** `GestureDetector must be used as a descendant of GestureHandlerRootView` error, and dragging the sheet down dismisses it.
2. `cd apps/rider && npx expo start -c` → the three "screens with the same name nested inside one another" warnings are **gone**; tab through Jobs / Alerts / Profile and confirm each opens its list screen and drill-downs (Job details → Execution → POD) still work.
3. Confirm the tab bar highlights the right tab and *Home → "View all jobs"* still lands on the Jobs list.

## 12. Proposed commit message and file list

```
fix(frontend): phase 18b sheet gesture root and rider route names

- shared: the BottomSheet rendered a GestureDetector inside a React Native Modal, which is its own
  native root, so the app-level GestureHandlerRootView did not cover it (Android logged
  "GestureDetector must be used as a descendant of GestureHandlerRootView"); the sheet's modal
  content now has its own GestureHandlerRootView
- rider: the Jobs/Alerts/Profile tabs each nested a screen with the same name, which React
  Navigation warns about; rename the inner screens to JobsList/AlertsFeed/ProfileHome and update the
  param lists and screen prop types (tab route names unchanged, so navigation is unaffected)
```

Files to stage (6 — 1 created, 5 modified):
`apps/shared/src/components/feedback.tsx` · `apps/rider/src/navigation/AppNavigator.tsx` · `apps/rider/src/navigation/types.ts` · `apps/rider/src/screens/JobsScreen.tsx` · `apps/rider/src/screens/ProfileScreen.tsx` · `docs/frontend/reports/PHASE-18B-REPORT.md`

STOPPED. Awaiting approval for the next phase.
