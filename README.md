# 🐾 Pet Commerce Ecosystem

India's most advanced **pet super-app** — commerce, healthcare, services, community, AI,
GPS tracking, subscriptions and smart-device integration in one premium mobile experience.

Built with **React Native (Expo) + TypeScript + Redux Toolkit + RTK Query + React Navigation + NativeWind**.

---

## 🚀 Quick start

```bash
npm install
npm run start      # Expo dev server (press a / i / w)
npm run android
npm run ios
npm run typecheck
```

> The app runs end-to-end today against local fixtures in `src/services/mock/`.
> Swap each RTK Query endpoint's `query` to the live gateway when the backend is ready —
> no screen changes required.

---

## 🧱 What's implemented in this scaffold

| Area | Status |
|------|--------|
| Design system (tokens, themes, dark/light) | ✅ |
| Reusable component library (Button, Card, Input, Badge, Skeleton/Shimmer, FAB, StateViews, Gradient headers) | ✅ |
| Navigation (Auth stack + 5 tab stacks, typed params) | ✅ |
| State management (Redux Toolkit: auth, cart, ui) + RTK Query base API w/ re-auth | ✅ |
| Auth flows (Onboarding, Login, Signup, OTP, Forgot password, Social) | ✅ |
| Home dashboard (health ring, quick actions, reminders, recommendations, Prime banner) | ✅ |
| Commerce (catalog, filters, product detail, cart, checkout) | ✅ |
| Services (marketplace, provider detail, slot booking) | ✅ |
| Community (feed, likes, post detail, comments) | ✅ |
| Pet management + health records | ✅ |
| AI Pet Assistant (chat UX) | ✅ |
| Profile + theme toggle + logout | ✅ |

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full product + technical blueprint
(screen inventory, DB schema, roadmap, MVP/Phase 2/3, deployment & scalability).

---

## 📁 Folder structure (feature-based clean architecture)

```
src/
├─ components/ui/        # Design-system primitives (shared, dumb, reusable)
├─ features/             # Vertical slices — each owns screens, components, slice
│  ├─ auth/              #   authSlice, schemas, screens/, components/
│  ├─ home/              #   DashboardScreen + widgets
│  ├─ pets/              #   PetProfileScreen
│  ├─ commerce/          #   Catalog, ProductDetail, ProductCard
│  ├─ cart/              #   cartSlice, Cart, Checkout
│  ├─ services/          #   ServicesHome, ProviderDetail, Booking
│  ├─ community/         #   Feed, PostDetail
│  ├─ ai/                #   AiAssistant
│  ├─ profile/           #   ProfileScreen
│  └─ ui/                #   uiSlice (global UI state)
├─ navigation/           # Root + Tab + typed stack navigators
├─ services/
│  ├─ api/               # RTK Query baseApi + injected endpoints
│  └─ mock/              # Local fixtures (removable once backend is live)
├─ store/                # configureStore + typed hooks
├─ theme/                # tokens, light/dark themes, ThemeProvider
└─ types/                # Shared domain models
```

### Why this structure scales
- **Feature folders** keep related code together → easy to split into packages / teams.
- **Single RTK Query `baseApi`** with `injectEndpoints` mirrors a microservices API gateway.
- **Design-system primitives** enforce visual consistency and accessibility in one place.
- **Typed navigation** eliminates a whole class of runtime bugs.
