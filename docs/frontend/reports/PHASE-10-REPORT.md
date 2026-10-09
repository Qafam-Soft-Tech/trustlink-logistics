# Phase 10 — Issues, help, notifications

Branch: `fe-phase-10-issues-help-alerts`
Scope: FR-C09 (status notifications), FR-C14 (support/issues). Push is deferred (SC-13); notifications are delivery-bound.

---

## 1. Inspection findings (before changes)

- **Nothing existed** for issues or help: no report/detail/FAQ screens, no routes. The only support-ish surface was the Alerts list (a Phase‑3 shell, listed in `SCAFFOLD_REGISTER.md` as a Phase 10 scaffold).
- **`AlertsScreen` was a flat list** — no grouping, no unread state, no per-status icons, no SMS copy; it already routed taps (terminal → `Details`, active → `TrackingHome`) from Phase 9.
- **Ports/hooks were sufficient**: `issue.create/listMine/get/updateStatus`, `notification.list`. No `useIssue*` hooks existed → added. `CreateIssueInput` requires `deliveryId, type, priority, title, description` (attachments optional) — the prompt's form only covers type + description, so priority is defaulted (SC‑32).
- **Contract gap found**: `Notification` has **no read/unread field and no read endpoint** → unread must be device-local (SC‑30); `AsyncStorage` (already approved) stores the read ids.
- **Mock data had to be enriched for the lifecycle**: all 6 fixture issues were `open`, so `open/in_progress/resolved/closed` were not demonstrable → deterministic statuses + resolutions added (still the same 6 issues). The 12 notifications were all dated in September, so the **Today** group would always be empty → the three newest are dated relative to "now" (same technique the auth flow already uses for `expiresAt`).
- **No contact details exist anywhere** → Help ships clearly marked placeholders (SC‑31).
- **Reusable**: `Card`, `ListItem`, `Chip`, `Badge`, `Banner`, `Input`, `TextArea`, `EmptyState`, `ErrorState`, `Skeleton`, `SuccessState`, `formatDate`, Ionicons. `AccountScreen` needed support entries for reachability (no dead ends).
- No new dependencies.

## 2. Summary (≤5 lines)

- Report an issue (delivery picker + type + summary/description, inline validation) → Submitted confirmation with a reference → My issues (filter by status) → issue detail with resolution.
- Help & support: FAQ accordion + contact channels as clearly-marked placeholders (call / WhatsApp / email via `Linking`).
- Alerts rebuilt: **Today / Earlier** grouping, unread treatment with a device-local read state, per-status icons, SMS-fallback copy, mark-all-read, pull-to-refresh, and tap-through routing by status.
- In-app status banner on both Alerts and Help ("push is off in R1, important updates also go by SMS").
- 128 shared tests pass (8 new); customer/rider typecheck + bundle clean; admin build clean.

## 3. Files created / modified / deleted

**Created (10)**
| Path | Why |
|---|---|
| `apps/shared/src/domain/support.ts` | Issue type/status labels + badge variants, notification status/fallback copy, `groupNotificationsByDay` |
| `apps/shared/src/__tests__/support.test.ts` | 8 tests: labels, grouping (incl. invalid dates), SMS copy, 6 issues across the lifecycle, create/reject, 12 notifications with 3 "today" |
| `apps/customer/src/storage/notificationReads.ts` | Device-local read ids (AsyncStorage) |
| `apps/customer/src/screens/support/helpContent.ts` | FAQ items, placeholder contact channels, support hours, per-status alert icon |
| `apps/customer/src/screens/support/ReportIssueScreen.tsx` | Delivery picker + type + summary/description + validation |
| `apps/customer/src/screens/support/IssueSubmittedScreen.tsx` | Confirmation + reference + next steps |
| `apps/customer/src/screens/support/MyIssuesScreen.tsx` | List with status filter, loading/empty/error |
| `apps/customer/src/screens/support/IssueDetailScreen.tsx` | Issue detail + resolution + linked delivery |
| `apps/customer/src/screens/support/HelpScreen.tsx` | FAQ accordion + contact support + shortcuts |
| `docs/frontend/reports/PHASE-10-REPORT.md` | This report |

**Modified (10)**
| Path | Why |
|---|---|
| `apps/shared/src/domain/index.ts` | Export `support` |
| `apps/shared/src/mocks/fixtures.ts` | 6 issues now span open/in_progress/resolved/closed with resolutions |
| `apps/shared/src/data/mock/scenarios.ts` | Three notifications dated "today" so Today/Earlier is visible |
| `apps/customer/src/hooks/index.ts` | `useMyIssues`, `useIssue`, `useCreateIssue`, `useReadNotificationIds`, `useMarkNotificationRead`, `useMarkAllNotificationsRead` |
| `apps/customer/src/navigation/types.ts` | `ReportIssue`, `IssueSubmitted`, `MyIssues`, `IssueDetail`, `Help` |
| `apps/customer/src/navigation/AppNavigator.tsx` | Wire the 5 new screens |
| `apps/customer/src/screens/AlertsScreen.tsx` | Rebuilt: grouping, unread, icons, SMS copy, banner, mark-all-read, refresh |
| `apps/customer/src/screens/AccountScreen.tsx` | Support card (My issues / Report an issue / Help) |
| `docs/frontend/SCAFFOLD_REGISTER.md` | Removed the Alerts row (now a real screen) |
| `docs/frontend/CONTRACT_LEDGER.md` | SC-30 / SC-31 / SC-32 |

**Deleted (0)**

## 4. Dependencies added

none (`AsyncStorage` and Ionicons were already present).

## 5. Commands run with real output

```
apps/shared$ npm run typecheck             → tsc --noEmit -p tsconfig.logic.json  (clean)
apps/shared$ npm test                      → Test Files 12 passed (12) · Tests 128 passed (128)
apps/shared$ node scripts/contrast-check.mjs → ALL CHECKS PASSED
hex-literal scan (new files)               → (no matches)
apps/customer$ npm run typecheck           → tsc --noEmit  (clean)
apps/customer$ npx expo export --platform android
                                           → Android Bundled 21266ms index.ts (1556 modules) · Exported
apps/rider$    npm run typecheck           → tsc --noEmit  (clean)
apps/rider$    npx expo export --platform android
                                           → Android Bundled 15784ms index.ts (1491 modules) · Exported
apps/admin$    npm run build               → ✓ 135 modules transformed · ✓ built in 1.12s
apps/admin$    npm run lint                → lint unavailable (OS policy): oxlint native binding blocked — not worked around
```
No `duplicate-react-native` warning.

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| ReportIssue: delivery picker, type, description | ✓ | `ReportIssueScreen` (picker from `useDeliveries`, 4 type chips, summary + description) |
| Submitted state | ✓ | `IssueSubmittedScreen` with reference + "View my issues"/"Done" |
| My issues + detail (open/in progress/resolved/closed) | ✓ | `MyIssuesScreen` filter chips + `IssueDetailScreen`; mock issues span all four states (test asserts) |
| Help/FAQ | ✓ | `HelpScreen` accordion (6 items) |
| Contact support (call, WhatsApp, email; marked placeholders) | ✓ | `CONTACT_CHANNELS` + "Placeholder" badges + explicit caption (SC-31) |
| Notifications list grouped Today/Earlier | ✓ | `groupNotificationsByDay` + two sections (test: 3 today / 9 earlier) |
| Unread treatment | ✓ | unread → bold title + "New" badge + primary icon; count line; mark-all-read (SC-30) |
| Per-status icons | ✓ | `alertIconFor(status)` in each row |
| SMS-fallback copy | ✓ | `notificationSmsFallback` ("Also sent to your phone by SMS.") + banner |
| Empty / error states | ✓ | Alerts (empty/error/skeleton), My issues (empty per filter/error), Report (no deliveries), Detail (error) |
| In-app status banner | ✓ | Alerts + Help banner ("push is off in R1 …") |
| Notification tap routes by delivery status | ✓ | terminal → `Tracking/Details`, otherwise `TrackingHome` |
| `IssuePort`, `NotificationPort` only | ✓ | no direct axios/fixtures in screens |
| No photo attachment, no preferences, no push permission | ✓ | none present; photo limitation stated in the form |
| No dead ends | ✓ | Account → My issues / Report / Help; Submitted → My issues; Detail → delivery + Help |
| Both themes | ✓ | tokens only (hex scan clean) |

## 7. Deviations and why

- **Issue `priority` is defaulted to `medium`** — the DTO requires it but the prompt's form does not include it; support triages (SC‑32, documented rather than inventing UI).
- **Fixture issues now vary across open/in_progress/resolved/closed** (they were all `open`, so the required states were unreachable).
- **Three notifications are dated relative to "now"** so the Today group is demonstrable (same relativity the auth flow already uses).
- **Unread is device-local** — the contract has no read field/endpoint (SC‑30).
- **Account screen touched** (nominally Phase 11) only to add the Support entries — required so the new screens are reachable.
- **Contact details are placeholders**, clearly labelled (SC‑31).

## 8. Ledger rows added / "Needs decision"

- **SC-30 (Needs decision)** — notifications have no read state or read endpoint; unread is device-local.
- **SC-31 (Needs decision)** — real support phone/WhatsApp/email lines needed (placeholders ship).
- **SC-32 (Resolved)** — `priority` is required by the DTO but not asked in the form; reports file as `medium`.

## 9. Scaffolds still present

- Onboarding "Slides" copy (Phase 17); Account (Phase 11); consent links (Phase 11); permanent `__DEV__` Design Gallery; Demo menu.
- **The Alerts row is removed** — Alerts is now a real screen.

## 10. Known issues, risks, open questions

- **No push notifications** (SC-13): in-app alerts + SMS copy only; there is no OS-level badge.
- **Unread resets per device** and there is no cross-device sync (SC-30).
- **Issues are read-only in the app** — customers cannot reply or attach photos (no attachment field, no comment endpoint); support replies appear only if the issue's `resolution` is set.
- **Contact channels are placeholders** and will dial/email nothing useful (SC-31).
- **Deeper grouping (weeks/months) is not implemented** — two buckets (Today/Earlier) as specified.
- SC-2 / SC-5 / SC-8 / SC-16 / SC-17 / SC-19 / SC-20 / SC-21 / SC-22 / SC-23 / SC-26 / SC-27 / SC-30 / SC-31 remain open.

## 11. How a human verifies this phase manually

1. `cd apps/customer && npx expo start -c`, Expo Go, sign in (`08031234567` / `482913`).
2. **Alerts** tab → banner, "3 unread", **Today** (3) and **Earlier** (9) sections; each row shows a status icon, channel, date; SMS rows show the fallback line. Tap the ✓ in the header → everything marks read. Pull to refresh.
3. Tap a **Delivered** alert → opens Delivery details; tap an **In transit** alert → opens live tracking.
4. **Account** → **Report an issue** → pick a delivery, choose a type, add a summary + description → **Submit report** → confirmation with a reference → **View my issues** (7 issues now, the new one on top as *Open*).
5. Filter My issues by **Resolved** → open *Charged after cancel* → resolution copy + **View the delivery** + **Contact support**.
6. **Help & support** → expand FAQ items; tap a contact row (opens the dialler/mail client) and note the **Placeholder** badges + caption.
7. Validation: submit a report with no delivery / a 2‑character summary → inline errors; check `Report an issue` with `emptyAccount`… (not available) — instead clear the form and confirm errors appear. Demo menu → **offline** → Alerts shows the error state with retry.

## 12. Proposed commit message and file list

```
feat(customer): phase 10 issues, help and notifications

- shared: support model (issue type/status labels, badge variants, notification status →
  icon/fallback copy, Today/Earlier grouping); issues span the whole lifecycle and three
  notifications are dated today; 8 vitest tests
- customer: Report an issue (delivery picker + type + description), Submitted, My issues
  (status filter), Issue detail (resolution, linked delivery) and Help & support (FAQ +
  placeholder contact channels)
- customer: Alerts rebuilt — Today/Earlier grouping, device-local unread state, per-status
  icons, SMS-fallback copy, mark-all-read, pull-to-refresh, in-app banner, status routing
- customer: Account gains Support entries so the new screens are reachable
- docs: ledger SC-30/SC-31/SC-32, scaffold register updated
```

Files to stage (20 — 10 created, 10 modified): as listed in §3.

STOPPED. Awaiting approval for the next phase.
