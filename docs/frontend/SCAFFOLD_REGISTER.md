# TrustLink Frontend — Scaffold Register

Temporary scaffolds present in the frontend. Every scaffold is a branded placeholder that must be replaced by a real screen in the phase noted.

| Scaffold | Location | Route(s) | Replaced in |
|---|---|---|---|
| Onboarding "Slides" copy | `apps/customer/src/screens/onboarding/OnboardingSlidesScreen.tsx` | `Onboarding → Slides` | Real art/copy in Phase 17 |
| Account | `apps/customer/src/screens/AccountScreen.tsx` (real shell) | `Main → Account` | Phase 11 |
| Demo menu | `apps/customer/src/demo/DemoMenuContext.tsx` | Overlay on Welcome/Account | Permanent (demo tool); refine per phase |
| Consent links (Terms/Privacy) | `apps/customer/src/screens/auth/PhoneEntryScreen.tsx` | external URLs `https://trustlink.ng/terms`, `https://trustlink.ng/privacy` (via `Linking.openURL`) | Phase 11 (in-app Terms/Privacy screens) |

**Notes**
- The Design Gallery is a permanent `__DEV__`-gated dev tool (not a scaffold); it is listed from the Demo menu.
- Master-rule exception: the Onboarding "Slides" screen is a functional first-run gate, but its visual polish is deferred to Phase 17.
