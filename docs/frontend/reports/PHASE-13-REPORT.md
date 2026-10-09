# Phase 13 — Rider B: jobs and execution

Branch: `fe-phase-13-rider-jobs-execution`
Scope: FR-R06–R11. Assignment stays admin-driven; `acknowledge` does not change status (SC-4); there is no decline route (SC-12).

---

## 1. Inspection findings (before changes)

- **`JobsScreen.tsx` was rebuilt in Phase 12** (so it was no longer hardcoded) but carried **no actions**: it listed the queue read-only with a note that execution arrives later (SC‑36). Phase 13 adds the lifecycle on top of it.
- **The wrong routes are gone** — Phase 12 removed `/jobs/:id/accept` and `/jobs/:id/pickup`; the real ports are `dispatch.myQueue`, `dispatch.acknowledge`, `execution.pickup/inTransit/complete/reportFailure`.
- **Ports already implement the intended engine** (verified in the mock source before changing anything):
  - `acknowledge(id)` → requires the rider to own the job and `ASSIGNED`; sets `acknowledgedAt` and **does not change status** (SC‑4).
  - `pickup` → `assigned → picked_up`; `inTransit` → `picked_up → in_transit`; `complete(proof)` → `in_transit → delivered` and **requires a photo + a 6-digit OTP equal to the delivery's `recipientCode`**, else `ValidationError`/`ConflictError` (“Recipient code does not match”).
  - `reportFailure(reason)` → from `picked_up|in_transit`; increments `redeliveryAttempts`; **1st failure → FAILED, 2nd → RETURNED** (`statusAfterFailure`).
- **Mock data already covers the required cases**: for rider‑1 there is an `assigned` job (del‑005), `picked_up` (del‑008), `in_transit` (del‑011 for rider‑2 / del‑012), completed history (del‑013/017) and a cancelled one; a failed-once delivery exists (fixtures `attempts: 1`) so the redelivery path is reachable via the customer Demo menu's **Advance** (which assigns the first eligible rider).
- **`recipientCode`** is a demo-only field on `Delivery`; every fixture uses `482913` and the **customer Demo menu already reveals recipient codes** — so the POD step can be verified end-to-end and a wrong code is rejected by the engine.
- **Gaps found**: no rider job screens/routes (`JobDetails`, `Execution`, `Pod`, `Failure`, issue reporting), no dispatch contact constant for “Can't take this? Call dispatch”, and the rider `Home` active-job card was not linked to a job.
- No new dependencies (`expo-image-picker` already present; maps are opened through a device **link**, not a map SDK).

## 2. Summary (≤5 lines)

- Jobs is now tabbed **Queue · Active · Completed** with a new-job banner, attempts badges (`Attempt 2 of 2`) and per-job navigation.
- JobDetails covers pickup/drop-off/package/recipient (call recipient, maps link), Accept with confirm + “Can't take this? Call dispatch”, and continues into execution.
- Execution is a one-hand stepper (Navigate → Confirm pickup → In transit → Arrived) with back blocked behind an explicit dialog offering the dispatch line.
- POD takes a photo + the recipient's 6-digit code (wrong codes are rejected by the engine) and Failure records recipient-unavailable / wrong-address / refused, showing the redelivery notice or the Returned confirmation after the second failure.
- 128 shared tests pass; rider + customer typecheck/bundle clean; admin build + lint clean; no earnings UI anywhere.

## 3. Files created / modified / deleted

**Created (8)**
| Path | Why |
|---|---|
| `apps/rider/src/screens/jobs/JobDetailsScreen.tsx` | Job detail + accept/dispatch + entry to execution |
| `apps/rider/src/screens/jobs/ExecutionScreen.tsx` | Execution stepper with maps link and status transitions |
| `apps/rider/src/screens/jobs/PodScreen.tsx` | Photo + recipient OTP, wrong-code handling, success |
| `apps/rider/src/screens/jobs/FailureScreen.tsx` | Reason + note, failed vs returned outcomes |
| `apps/rider/src/screens/jobs/RiderReportIssueScreen.tsx` | Rider issue report bound to a delivery |
| `apps/rider/src/screens/jobs/ExecutionExitGuard.tsx` | Back-blocked dialog (call dispatch / keep going) |
| `apps/rider/src/screens/jobs/dispatch.ts` | Placeholder dispatch contact constant (SC-37) |
| `docs/frontend/reports/PHASE-13-REPORT.md` | This report |

**Modified (6)**
| Path | Why |
|---|---|
| `apps/rider/src/hooks/index.ts` | `useMyJobs`, `useDeliveryJob`, `useAcknowledgeJob`, `useConfirmPickup`, `useMarkInTransit`, `useReportFailure`, `useCompleteDelivery` (rewired), `useCreateRiderIssue` |
| `apps/rider/src/navigation/types.ts` | `JobDetails`/`Execution`/`Pod`/`Failure`/`ReportIssue` params |
| `apps/rider/src/navigation/AppNavigator.tsx` | Registered the five screens (execution has gestures disabled) |
| `apps/rider/src/screens/JobsScreen.tsx` | Queue/Active/Completed tabs, new-job banner, attempts badge, job navigation |
| `apps/rider/src/screens/HomeScreen.tsx` | Active-job card now opens JobDetails (the only Home change) |
| `docs/frontend/CONTRACT_LEDGER.md` | SC-37 / SC-38 / SC-39 |

**Deleted (0)**

## 4. Dependencies added

none.

## 5. Commands run with real output

```
apps/shared$ npm run typecheck             → tsc --noEmit -p tsconfig.logic.json  (clean)
apps/shared$ npm test                      → Test Files 12 passed (12) · Tests 128 passed (128)
apps/shared$ node scripts/contrast-check.mjs → ALL CHECKS PASSED
hex-literal scan (new rider files)         → (no matches)
apps/rider$    npm run typecheck           → tsc --noEmit  (clean)
apps/rider$    npx expo export --platform android
                                           → Android Bundled 15542ms index.ts (1506 modules) · Exported
apps/customer$ npm run typecheck           → tsc --noEmit  (clean)
apps/customer$ npx expo export --platform android
                                           → Android Bundled 17215ms index.ts (1563 modules) · Exported
apps/admin$    npm run build               → ✓ 135 modules transformed · ✓ built in 863ms
apps/admin$    npm run lint                → Found 2 warnings and 0 errors. (policy block not hit this run)
```

## 6. Acceptance checklist

| Criterion | ✓ | Evidence |
|---|---|---|
| Jobs: Queue · Active · Completed, no money | ✓ | `JobsScreen` chips filter by status groups; only delivery fares appear (no earnings) |
| JobDetails (pickup/drop-off, package, recipient, call) | ✓ | `JobDetailsScreen` + `tel:` recipient call + maps link |
| Acknowledge with confirm and “Can't take this? Call dispatch” | ✓ | Confirm `Dialog` → `dispatch.acknowledge`; ghost button dials the dispatch constant |
| In-app new-job banner | ✓ | Banner on Jobs when assigned jobs are unacknowledged (`acknowledgedAt` empty) |
| Execution stepper (Navigate via device maps link, Confirm pickup, In transit, Arrived) | ✓ | `ExecutionScreen` + `StepIndicator`; maps opened with a `Linking` URL (no map SDK) |
| POD: photo + recipient-entered OTP with wrong-OTP state | ✓ | `PodScreen`: `expo-image-picker` + `OtpInput`; the engine rejects a wrong code and the screen shows the error + clears the code |
| Failure (recipient unavailable / wrong address / refused, note) | ✓ | `FailureScreen` chips + optional note (note is local — SC‑39) |
| Redelivery job (“attempt 2 of 2”) | ✓ | `Attempt 2 of 2` badge when `redeliveryAttempts >= 1`; reachable via the customer Demo menu's **Advance** on the failed fixture |
| Returned confirmation after the second failure | ✓ | `FailureScreen` outcome branch when the engine returns `returned` |
| ReportIssue | ✓ | `RiderReportIssueScreen` → `issue.create` for the job |
| Completed list | ✓ | Completed tab (delivered/failed/returned/cancelled) |
| Replace every remaining dead `onPress` | ✓ | All buttons act (call, navigate, transitions, report, accept); grep for `onPress={() => {}}` in the rider app is clean |
| Real routes only | ✓ | Ports map to `dispatch/my-queue`, `dispatch/:id/acknowledge`, `deliveries/:id/pickup|in-transit|complete|failure` |
| No invented decline route | ✓ | No decline action; unaccepted jobs offer “Call dispatch” instead |
| Mock consistent with customer fixtures | ✓ | Same fixture deliveries/statuses; the customer's Advance/reassign flows drive rider state changes |
| Back blocked mid-execution except through dialogs | ✓ | `ExecutionExitGuard` on Execution/Pod/Failure → “Call dispatch” / “Keep going” |
| Phase 12 KYC/Home untouched (except linking the active job) | ✓ | Only the Home active-job block changed |
| Transitions follow the engine | ✓ | Both flows are driven purely by `execution.*`; see the walk-through below |

### End-to-end walk-throughs

**Success**
```
assigned (acknowledgedAt null) → [Accept job + confirm]  dispatch.acknowledge   → assigned (acknowledgedAt set, status unchanged)
                               → [Confirm pickup]        execution.pickup      → picked_up
                               → [Start trip]            execution.inTransit   → in_transit
                               → [Arrived] → [Complete]  execution.complete    → delivered (photo + matching 6-digit code)
                               → Pod success → Back to jobs (Completed tab)
```
**Failure (1st)** — `in_transit` + `reportFailure('recipient_unavailable')` → `redeliveryAttempts=1`, status **failed** → screen shows “TrustLink will arrange one redelivery”.
**Failure (2nd)** — a job with `redeliveryAttempts=1` assigned again → `reportFailure(...)` → `statusAfterFailure(1)` = **returned** → the Returned confirmation is shown.
**Wrong OTP** — `execution.complete` with a code ≠ the delivery's `recipientCode` → the engine throws `ConflictError('Recipient code does not match')` → the error banner renders and the code field is cleared.

## 7. Deviations and why

- **The failure note is not sent**: `POST /deliveries/:id/failure` accepts only `{ reason }`, so the note is collected for the rider's own reference with an explicit caption (SC‑39).
- **Maps are opened as a device link** (`https://www.google.com/maps/search/?api=1&query=…`), not an embedded map — no map SDK is approved and R1 is status-based.
- **“Can't take this?” dials a placeholder dispatch number** (SC‑37) — there is no published line, and no decline route exists (SC‑12).
- **Back-blocking is conditional**: it is active mid-execution (before arrival) so that completing/failing can pop the stack; the dialog offers the dispatch line rather than discarding the job.
- **Acknowledge navigates straight into Execution** after the confirm dialog (fewer taps, matches the one-hand design requirement).

## 8. Ledger rows added / "Needs decision"

- **SC-37 (Needs decision)** — the dispatch phone line used by “Call dispatch” is a placeholder.
- **SC-38 (Resolved)** — POD's `recipientOtp` is demo-only (backend never issues it); the mock supplies the fixture code, the customer Demo menu reveals it, and the rider POD rejects a wrong code. Also records that no decline route exists (SC‑12).
- **SC-39 (Needs decision)** — the failure route accepts no note; only the reason is sent.

## 9. Scaffolds still present

- Customer: Onboarding "Slides" copy (Phase 17); permanent `__DEV__` Design Gallery; Demo menu.
- **Rider: none** — the job/execution screens are all real and no placeholders remain.

## 10. Known issues, risks, open questions

- **POD OTP is a demo value** (SC‑38): in production the recipient code must be generated and delivered server-side.
- **No decline route** (SC-12): a rider who cannot take a job must call dispatch; the job stays ASSIGNED until dispatch reassigns.
- **Dispatch phone is a placeholder** (SC‑37).
- **Failure notes are local only** (SC‑39).
- **The failure route does not carry coordinates** (no GPS in R1), so `latitude/longitude` are omitted.
- **Job assignment/progression is admin-driven** — riders cannot accept unassigned jobs, and the runner must use the customer Demo menu's **Advance** (or a future admin app) to move jobs.
- SC-2 / SC-5 / SC-8 / SC-12 / SC-16 / SC-17 / SC-19 / SC-20 / SC-21 / SC-22 / SC-23 / SC-26 / SC-27 / SC-30 / SC-31 / SC-33 / SC-35 / SC-37 / SC-39 remain open.

## 11. How a human verifies this phase manually

1. `cd apps/rider && npx expo start -c`, sign in as the approved rider (`08050000001`, OTP `482913`).
2. **Jobs** → **Queue** shows the assigned job with a **Needs acceptance** badge; the **New job assigned** banner is visible.
3. Open the job → **Accept job** (confirm) → you land in Execution. Press Back → the dialog offers **Call dispatch** / **Keep going**.
4. **Confirm pickup** → step advances (status Picked up); **Start trip (in transit)** → step advances; **Arrived at drop-off** → the two terminal actions appear.
5. **Complete delivery** → attach a photo, enter a **wrong** code (e.g. `000000`) → the error banner appears and the code clears; enter the real code from the customer app's **Demo menu → recipient codes** (`482913`) → success → **Back to jobs** → the job is under **Completed**.
6. **Jobs → Active** → for the `in_transit` fixture job (del‑011/del‑012 as assigned) → Execution → Arrived → **Report a problem** → choose *Recipient unavailable* → submit → the **Delivery unsuccessful** notice with the redelivery message.
7. In the **customer** app, Demo menu → **Advance** the failed delivery to SEARCHING → advance again (assigns the first eligible rider) → back in the rider app the job reappears with **Attempt 2 of 2** → run it → **Report a problem** again → **Returned to sender** confirmation.
8. **Jobs → Completed** lists delivered/failed/returned/cancelled jobs; a job's **Report issue** submits through the issue port and shows the success state.
9. Confirm there is **no earnings or money screen** anywhere in the rider app.

## 12. Proposed commit message and file list

```
feat(rider): phase 13 job execution lifecycle

- rider: Jobs tabbed Queue / Active / Completed with a new-job banner, "Attempt 2 of 2"
  badge and job navigation
- rider: JobDetails (pickup, drop-off, package, recipient, call, maps) with Accept + confirm
  and "Can't take this? Call dispatch" (no decline route — SC-12)
- rider: execution stepper (Navigate via a device maps link, Confirm pickup, In transit,
  Arrived) driven by dispatch/execution routes; back blocked behind a dialog
- rider: POD with photo + recipient OTP (wrong code rejected by the engine) and Failure with
  reasons, redelivery notice and the Returned confirmation after the second failure
- rider: rider-side issue reporting; Home active-job card links into JobDetails
- docs: ledger SC-37/SC-38/SC-39
```

Files to stage (14 — 8 created, 6 modified): as listed in §3.

STOPPED. Awaiting approval for the next phase.
