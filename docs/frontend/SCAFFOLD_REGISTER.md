# TrustLink Frontend — Scaffold Register

Temporary scaffolds present in the frontend. Every scaffold is a branded placeholder that must be replaced by a real screen in the phase noted.

| Scaffold | Location | Route(s) | Replaced in |
|---|---|---|---|
| Onboarding "Slides" copy | `apps/customer/src/screens/onboarding/OnboardingSlidesScreen.tsx` | `Onboarding → Slides` | Real art/copy in Phase 17 |
| Demo menu | `apps/customer/src/demo/DemoMenuContext.tsx` | Overlay on Welcome/Account | Permanent (demo tool); refine per phase |

**Notes**
- The Design Gallery is a permanent `__DEV__`-gated dev tool (not a scaffold); it is listed from the Demo menu.
- Master-rule exception: the Onboarding "Slides" screen is a functional first-run gate, but its visual polish is deferred to Phase 17.
- **Rider app (Phase 12): no temporary scaffolds remain** — the legacy hardcoded screens were replaced, and `EarningsScreen` was deleted (D7, earnings out of scope).
- **Admin app (Phase 14): no scaffolds remain** — all pages were rebuilt on the admin mock layer; the unused Vite leftovers (`App.css`, `react.svg`, `vite.svg`, `hero.png`) and the backendless **Settings**/**Analytics** pages were deleted (Analytics → Reports).
