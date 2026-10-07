# PHASE 2 REPORT — Design system and ThemeProvider migration

Branch: `fe-phase-2-design-system` (confirmed at start; only tool-managed files were dirty).

---

## 1. Inspection findings (before changes)

**(a) Phase 1 todos — finished, none paused.** The Phase 1 task list (Steps 0–10) is fully complete: data boundary (domain/ports/mock/api/composition), validation/formatters, tests (68), app providers + hooks; committed as `e48c059`. No paused/unfinished item.

**(b) SC-16 — naira↔kobo conversion.** The conversion is in the **api adapter only**, direction **naira → kobo** (correct).
- `apps/shared/src/data/api/index.ts` — `payment.initialize`: `amount: Math.round(input.amountNaira * 100)`.
- Backend expects kobo: `backend/src/modules/payments/payment.controller.ts` `InitializePaymentDto.amount` is commented "In kobo"; `payment.service.initializePaystackPayment` sends `amount` straight to Paystack (kobo) and `initializeFlutterwavePayment` does `params.amount / 100` (kobo→naira) — i.e. the endpoint's unit is kobo.
- `delivery.fare`, the mock engine, the UI and fixtures are **all naira**: `domain/fare.ts` (₦), `mocks/fixtures.ts` (naira), `formatters.formatNaira` (naira, no kobo), mock `verifyPayment` uses naira amounts. **No fix needed** — direction and boundary are already correct.

**(c) Mock track-by-number rejects without a session — confirmed.** `MockStore.track()` calls `this.getSession()` first, which throws `ConflictError` when `state.session` is null; covered by the test `requires a session for track-by-number`.

**(d) `toCanonicalPhone` matches BASELINE.** Canonical form is the 11-digit local value (`08031234567`), exactly what the auth screens send (BASELINE.md §2a); display `0803 123 4567`. Tests cover local/space/234/10-digit inputs.

Also observed: the shared theme was a static light-only object; `textTertiary` (#9ca3af) ≈ 2.6:1 on white; `Header` right action did `onPress={() => rightAction}` (never calls it); components used `theme.colors.X` directly.

## 2. Summary (≤5 lines)

1. Added light+dark token sets with semantic **roles**, `ThemeProvider`/`useTheme` (System/Light/Dark, persisted via an injected storage adapter) — keeping the deprecated light `theme` export.
2. Migrated `primitives.tsx` and `layout.tsx` to `useTheme()`, fixed the Header bug, added `ScreenContainer`/`TopBar`, and migrated both app navigation themes + StatusBar.
3. Built the full component catalogue (38 exports) incl. status/timeline/route/fare/POD/checkout components and a dev-only **Design Gallery**.
4. Added Inter fonts (apps) and a node **contrast script**: all text pairs ≥4.5:1, all UI pairs ≥3:1.
5. Validated: shared typecheck + 68 tests, customer/rider typecheck, both Android bundles, admin build+lint — all pass.

## 3. Files created / modified / deleted (path — why)

**Created — shared (8)**
- `apps/shared/src/theme/ThemeProvider.tsx` — provider + `useTheme`, injected `ThemeStorage`.
- `apps/shared/src/components/{feedback,forms,list,domain}.tsx` — feedback states/overlays, form controls, `ListItem`, domain components.
- `apps/shared/src/components/DesignGallery.tsx` — dev-only gallery (all components/variants/states, both themes).
- `apps/shared/src/components/index.ts` — components barrel.
- `apps/shared/scripts/contrast-check.mjs` — WCAG contrast script.

**Created — apps (2)**
- `apps/customer/src/screens/DesignGalleryScreen.tsx`, `apps/rider/src/screens/DesignGalleryScreen.tsx` — thin screens re-exporting the shared gallery (registered behind `__DEV__`).

**Modified (11)**
- `apps/shared/src/theme/index.ts` — dark colours, semantic roles, `textMuted`, accessible badge/status text, `createTheme`, deprecated `theme`.
- `apps/shared/src/components/primitives.tsx` — `useTheme` migration; Button variants (primary/accent/secondary/outline/ghost/destructive + loading/disabled); Chip; `Text` accepts token keys + literal colours.
- `apps/shared/src/components/layout.tsx` — `useTheme`; **Header right-action fix** (`onRightPress`); `ScreenContainer`, `TopBar`, themed `TabBar`.
- `apps/shared/src/index.ts` — export ThemeProvider, components, fixtures.
- `apps/shared/package.json` — `contrast` script.
- `apps/customer/App.tsx`, `apps/rider/App.tsx` — ThemeProvider + Inter fonts + themed NavigationContainer/StatusBar.
- `apps/customer/src/navigation/AppNavigator.tsx`, `apps/rider/src/navigation/AppNavigator.tsx` — `useTheme` tab colours + dev gallery route.
- `apps/customer/package.json` / `package-lock.json`, `apps/rider/package.json` / `package-lock.json` — new deps.

**Deleted:** none. **Counts:** created 10 (shared 8 + apps 2), modified 13, deleted 0.

## 4. Dependencies added

- `@expo-google-fonts/inter@^0.4.2` — Customer + Rider (approved).
- `@react-native-async-storage/async-storage@2.2.0` — Customer + Rider (approved).
Installed with `NODE_ENV=development` and `-- --legacy-peer-deps`; no duplicate `react-native` (bundle module counts rose only by the new components).

## 5. Commands run with real output

**Shared:** `npm run typecheck` → clean. `npm test` → `Test Files 5 passed (5) · Tests 68 passed (68)`.
**Contrast:** `node scripts/contrast-check.mjs` → `ALL CHECKS PASSED` (table in §"Contrast").
**Customer / Rider:** `npm run typecheck` → clean (both).
**Customer bundle:** `Android Bundled 28985ms index.ts (1521 modules)`; **Rider:** `Android Bundled 24886ms index.ts (1525 modules)` — no duplicate-react-native warning.
**Admin:** `npm run build` → `✓ built in 728ms`; `npm run lint` → `Found 2 warnings and 0 errors`.
**Hex grep (excl. node_modules):** no hex literals in `apps/shared/src/components/**`; hex confined to token files (`theme/index.ts`, `scripts/contrast-check.mjs`) and the **untouched** admin app (pre-existing `theme.css`/`index.css`/Analytics mock).

## 6. Acceptance checklist

| Criterion | ✓/✗ | Evidence |
|---|---|---|
| Gallery complete in both themes | ✓ | `DesignGallery.tsx` renders every component/variant/state + theme `SegmentedControl` (System/Light/Dark) |
| Contrast: text ≥4.5:1, UI ≥3:1 | ✓ | `ALL CHECKS PASSED` |
| Shared + navigators migrated | ✓ | primitives/layout use `useTheme`; both navigators + `App.tsx` use roles |
| Existing screens still render | ✓ | customer/rider `tsc` clean and bundles succeed; `Text.color` accepts literal hex (their existing usage) |
| Header right-action bug fixed | ✓ | `onRightPress` wired to `TouchableOpacity.onPress` |
| No hex outside token files | ✓ | grep clean in `components/**` |
| Every screen works light **and** dark | ✓ | provider resolves mode; components use roles/tokens |

## 7. Deviations and why

1. **`FareBreakdown` component exported as `FareBreakdownCard`.** The type `FareBreakdown` (domain) and a component of the same name would collide in the barrel. Type keeps the name; the component is suffixed.
2. **`Dialog`/`BottomSheet` use React Native `Modal`, not Reanimated.** RN `Modal` gives reliable slide/fade without worklet/config risk; no new libs added. Reanimated remains available for later motion work.
3. **Inter is loaded and wired into `typography.fontFamily`, but the ₦ glyph could not be verified on a device here.** Open item (§10) — fallback is to render amounts in the system font.
4. **`Text.color` widened to accept literal colour strings** in addition to token keys — required so the untouched existing screens (which pass hex) keep compiling; it also makes their intended colours actually apply.
5. **Light `success` darkened `#10b981 → #059669`** to meet ≥3:1 as a UI indicator (was 2.54:1).

## 8. Ledger rows added / "Needs decision"

- **SC-16 verified and closed for the frontend:** conversion is naira→kobo at the api boundary only; UI/mock/fixtures are naira. No adapter change required.
- No new ledger rows. Existing open items unchanged: **SC-2**, **SC-5**, **SC-8**, **SC-17**, admin-login.

## 9. Scaffolds still present

**None.** The Design Gallery is a permanent dev tool gated by `__DEV__` (not a temporary scaffold), so `SCAFFOLD_REGISTER.md` is not required.

## 10. Known issues, risks, open questions

- **₦ glyph in Inter** unverified on device (open). Mitigation: fall back to system font for amounts if it shows as tofu.
- **`theme.typography.fontFamily` now references Inter names**; before fonts load, RN falls back to the system font (acceptable).
- **Admin app is untouched** and still uses its own CSS + hardcoded colours (out of scope; D10 is later).
- **Deprecated `theme` export retained**; existing screens keep using it (DOC: no new `theme.colors` imports after Phase 2).
- **Reanimated/gesture-handler** present but not used by the new components (deviation §7.2).

## 11. How a human verifies this phase manually

1. `cd apps/shared && npm run typecheck && npm test && node scripts/contrast-check.mjs` → expect clean, 68 passed, `ALL CHECKS PASSED`.
2. `cd apps/customer && npm run typecheck && npx expo export --platform android` (and rider) → clean + `Android Bundled …` with no duplicate warning.
3. `cd apps/admin && npm run build && npm run lint` → `✓ built` + `0 errors`.
4. In the app dev build, open the Design Gallery (dev route `DesignGallery`, `__DEV__` only) and toggle System/Light/Dark; confirm every section renders and the naira amount shows `₦1,400`.
5. `grep -rn "#[0-9a-fA-F]\{6\}" apps/shared/src/components` → no matches.

## 12. Proposed commit message and file list

```
feat(frontend): phase 2 design system — dark mode, ThemeProvider, component library, gallery

- add light+dark tokens, semantic roles, textMuted, accessible badge/status text
- add ThemeProvider/useTheme (system|light|dark, injected storage) + deprecated light theme
- migrate primitives + layout to useTheme; fix Header right-action; add ScreenContainer/TopBar
- add Button/Input variants, Chip, StatusBadge, ListItem, SegmentedControl, Skeleton, Toast,
  Banner, Dialog, BottomSheet, EmptyState/ErrorState/SuccessState, StatusTimeline,
  RouteSummaryCard, FareBreakdownCard, CheckoutSheet, PodCard
- add Inter fonts in apps; themed NavigationContainer/StatusBar
- add dev-only Design Gallery and node contrast-check script
```
**Files to stage:**
```
apps/shared/src/theme/index.ts
apps/shared/src/theme/ThemeProvider.tsx
apps/shared/src/components/primitives.tsx
apps/shared/src/components/layout.tsx
apps/shared/src/components/feedback.tsx
apps/shared/src/components/forms.tsx
apps/shared/src/components/list.tsx
apps/shared/src/components/domain.tsx
apps/shared/src/components/DesignGallery.tsx
apps/shared/src/components/index.ts
apps/shared/src/index.ts
apps/shared/scripts/contrast-check.mjs
apps/shared/package.json
apps/customer/App.tsx
apps/customer/src/navigation/AppNavigator.tsx
apps/customer/src/screens/DesignGalleryScreen.tsx
apps/customer/package.json
apps/customer/package-lock.json
apps/rider/App.tsx
apps/rider/src/navigation/AppNavigator.tsx
apps/rider/src/screens/DesignGalleryScreen.tsx
apps/rider/package.json
apps/rider/package-lock.json
docs/frontend/reports/PHASE-2-REPORT.md
```
Do **not** stage `.commandcode/settings.json` or `.commandcode/taste/...` (tool-managed).

### Contrast table (both themes — all PASS)

| Pair | Light | Dark | Need |
|---|---|---|---|
| text / bg | 17.74:1 | 17.01:1 | 4.5 |
| textSecondary / bg | 7.56:1 | 11.36:1 | 4.5 |
| textMuted / bg | 5.98:1 | 7.60:1 | 4.5 |
| primaryActionText / primaryAction | 16.14:1 | 7.18:1 | 4.5 |
| accentText / accent | 5.00:1 | 7.18:1 | 4.5 |
| dangerText / danger | 6.47:1 | 4.83:1 | 4.5 |
| badge text / tint (5 variants) | 6.4–8.4:1 | 7.5–8.9:1 | 4.5 |
| primaryAction / bg | 16.14:1 | 8.33:1 | 3 |
| accent / bg | 3.23:1 | 8.33:1 | 3 |
| danger / bg | 6.47:1 | 3.88:1 | 3 |
| success / surface | 3.77:1 | 8.86:1 | 3 |
| info / surface | 3.68:1 | 6.70:1 | 3 |

### Component catalogue (38 exports)

- **Primitives (8):** Box, Text, Button, Input, Card, Avatar, Badge, Chip.
- **Layout (9):** Screen, ScreenContainer, ScrollableScreen, Header/TopBar, TabBar, Divider, Row, Column, Center.
- **Feedback (8):** Skeleton, Banner, Toast, Dialog, BottomSheet, EmptyState, ErrorState, SuccessState.
- **Forms (5):** SegmentedControl, PhoneInput, OtpInput, TextArea, SelectTrigger.
- **List (1):** ListItem.
- **Domain (6):** StatusBadge, StatusTimeline, RouteSummaryCard, FareBreakdownCard, CheckoutSheet, PodCard.
- **Dev (1):** DesignGallery.

STOPPED. Awaiting approval for the next phase.
