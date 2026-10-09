# TrustLink Frontend — Scaffold Register

Temporary scaffolds present in the frontend. Every scaffold is a branded placeholder that must be replaced by a real screen in the phase noted.

| Scaffold | Location | Route(s) | Replaced in / justification |
|---|---|---|---|
| Onboarding "Slides" copy | `apps/customer/src/screens/onboarding/OnboardingSlidesScreen.tsx` | `Onboarding → Slides` | **Justified** — functional first-run gate; visual polish deferred to Phase 17 |
| Demo menu | `apps/customer/src/demo/DemoMenuContext.tsx` | Overlay on Welcome/Account | **Justified** — permanent investor-demo tool (scenarios, advance, recipient codes, theme, reset) |
| Design Gallery | `apps/shared/src/components/DesignGallery.tsx` + per-app screen | `DesignGallery` (`__DEV__` only) | **Justified** — permanent developer tool; never shipped in production (`__DEV__`-gated) |
| Brand assets (customer) | `apps/customer/assets/{icon,android-icon-foreground,android-icon-background,android-icon-monochrome,favicon,splash-icon}.png` | `app.json` icon/adaptiveIcon/web.favicon | **Replaced by brand assets** — will move to `assets/brand/` once Ilyas supplies them. Current files are the template placeholders and their content is JPEG mislabeled `.png` (expo-doctor flags it, SC-44); replace with real PNGs (icon 1024×1024, adaptive foreground/background/monochrome 1024×1024) and update the paths in `app.json` |
| Brand assets (rider) | `apps/rider/assets/{icon,android-icon-foreground,android-icon-background,android-icon-monochrome,favicon,splash-icon}.png` | `app.json` icon/adaptiveIcon/web.favicon | **Replaced by brand assets** — same as above (SC-44) |

_No other scaffolds remain: the customer, rider and admin apps are built on real screens and real ports (see Phases 3–14)._

**Notes**
- The Design Gallery is a permanent `__DEV__`-gated dev tool (not a scaffold); it is listed from the Demo menu.
- Master-rule exception: the Onboarding "Slides" screen is a functional first-run gate, but its visual polish is deferred to Phase 17.
- **Rider app (Phase 12): no temporary scaffolds remain** — the legacy hardcoded screens were replaced, and `EarningsScreen` was deleted (D7, earnings out of scope).
- **Admin app (Phase 14): no scaffolds remain** — all pages were rebuilt on the admin mock layer; the unused Vite leftovers (`App.css`, `react.svg`, `vite.svg`, `hero.png`) and the backendless **Settings**/**Analytics** pages were deleted (Analytics → Reports).
