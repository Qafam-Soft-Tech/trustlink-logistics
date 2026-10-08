# TrustLink Frontend — Scaffold Register

Temporary scaffolds present in the frontend. Every scaffold is a branded placeholder that must be replaced by a real screen in the phase noted.

| Scaffold | Location | Route(s) | Replaced in |
|---|---|---|---|
| `ScreenScaffold` component | `apps/customer/src/components/ScreenScaffold.tsx` | — (shared by placeholders) | Remove when the last placeholder is replaced |
| Onboarding "Slides" copy | `apps/customer/src/screens/onboarding/OnboardingSlidesScreen.tsx` | `Onboarding → Slides` | Real art/copy in Phase 17 |
| New Delivery steps | `apps/customer/src/components/PlaceholderScreen.tsx` in `AppNavigator.tsx` | `NewDelivery → Pickup / Dropoff / Package / Sender / Review` | Phase 6 |
| Fare & payment steps | same | `NewDelivery → Fare / PaySummary` | Phase 7 |
| Processing / Result | `apps/customer/src/navigation/AppNavigator.tsx` (inline) | `NewDelivery → Processing / Result` | Phase 7 |
| Tracking screens | `PlaceholderScreen` in `AppNavigator.tsx` | `Tracking → TrackingHome / Timeline / POD / Failed / Returned / CancelFlow` | Phases 8–9 |
| Deliveries list | `apps/customer/src/screens/DeliveriesScreen.tsx` (real shell over ports) | `Main → Deliveries` | Phase 9 |
| Alerts list | `apps/customer/src/screens/AlertsScreen.tsx` (real shell over ports) | `Main → Alerts` | Phase 10 |
| Account | `apps/customer/src/screens/AccountScreen.tsx` (real shell) | `Main → Account` | Phase 11 |
| Track by number | `apps/customer/src/screens/TrackByNumberScreen.tsx` (real shell over port) | `Tracking → TrackByNumber` | Phase 8 |
| Demo menu | `apps/customer/src/demo/DemoMenuContext.tsx` | Overlay on Welcome/Account | Permanent (demo tool); refine per phase |
| Consent links (Terms/Privacy) | `apps/customer/src/screens/auth/PhoneEntryScreen.tsx` | external URLs `https://trustlink.ng/terms`, `https://trustlink.ng/privacy` (via `Linking.openURL`) | Phase 11 (in-app Terms/Privacy screens) |

**Notes**
- The Design Gallery is a permanent `__DEV__`-gated dev tool (not a scaffold); it is listed from the Demo menu.
- Master-rule exception: the Onboarding "Slides" screen is a functional first-run gate, but its visual polish is deferred to Phase 17.
