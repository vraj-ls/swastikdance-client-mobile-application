# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start           # Start Expo dev server (Metro bundler)
npm run android     # Run on Android device/emulator (requires prebuild)
npm run ios         # Run on iOS simulator (Mac only, requires prebuild)
npm run web         # Run in browser
```

This is a **bare workflow** Expo app (not managed workflow) — native `ios/` and `android/` folders exist and are committed. There is no EAS build config; build natively with Xcode or Android Studio.

For local device testing, swap the commented-out URLs in `constants/config.js` to use your machine's LAN IP instead of the production URLs.

## Architecture

### Hybrid WebView Pattern

The core design is a **native shell + WebView hybrid**:

1. **Native auth screens** (Login, Register, ForgotPassword) call the Express backend's `/mobile/*` REST endpoints via Axios.
2. After login, the JWT is stored in `AsyncStorage` (key: `auth_token`).
3. The **WebView screen** loads `WEB_APP_URL/{targetRoute}?token=JWT` — the token is passed as a URL query parameter so the web app auto-authenticates the user.
4. If the WebView navigates to `/login` (session expired or logout), the native app clears its token and resets to the Login screen.

### Navigation Structure

```
Stack.Navigator (App.js)
├── Login / Register / ForgotPassword  ← unauthenticated screens
├── Main (MainTabNavigator)             ← bottom tab navigator
│   ├── Notification tab (NotificationScreen)
│   ├── Dashboard tab (DashboardScreen)
│   └── Profile tab (ProfileScreen)
│   └── FloatingActionButton           ← opens menu to navigate to WebView routes
└── EditProfile / ChangePassword / AddStudent / StudentDetail / WebView  ← pushed modally
```

`MainTabNavigator` renders `FloatingActionButton` outside the tab navigator (as a sibling `View` child) so it floats above the tab bar. The FAB opens a modal menu with shortcuts to WebView routes (`/pass`, `/enrolment`, `/order`, `/admission`).

### Services

- **`services/authService.js`** — Singleton `AuthService` class. Also configures **global Axios interceptors** at module level: request interceptor injects the Bearer token; response interceptor handles 401s by clearing auth and navigating to Login. The navigation ref must be set via `authService.setNavigationRef()` before interceptors can redirect.
- **`services/notificationService.js`** — Singleton. Manages Firebase FCM token retrieval (native FCM, not Expo push service), Android notification channel creation, and foreground/background notification routing. FCM background handler is registered at module scope in `App.js` (required by `@react-native-firebase/messaging`).

### FCM / Push Notifications

Uses **`@react-native-firebase/messaging`** (native Firebase SDK, not Expo's push abstraction). The FCM token is sent to the backend at login time (`login(email, password, role, fcmToken)`). Notification taps deep-link into the app via `notificationService.handleNotificationTap()` using the `type` field in `data` payload (`STUDENT_WELCOME`, `SESSION_REMINDER`, `GENERAL`).

Foreground FCM messages are shown as in-app banners via `<InAppNotification>` rendered in `App.js` above the `NavigationContainer`.

### Key Files

| File | Purpose |
|------|---------|
| `App.js` | Root: navigation setup, FCM background handler, foreground notification banner |
| `constants/config.js` | `API_URL`, `WEB_APP_URL`, API endpoint paths, storage keys |
| `constants/theme.js` | `colors`, `spacing`, `typography`, `borderRadius`, `shadows` design tokens |
| `services/authService.js` | All REST calls + Axios interceptors + JWT helpers |
| `services/notificationService.js` | FCM token, notification listeners, tap routing |
| `hooks/useApi.js` | `useApi` and `useFetch` hooks (wrap Axios with loading/error state) |
| `utils/formatters.js` | `formatDate`, `formatCurrency` |

### Styling Conventions

- All screens use `StyleSheet.create()` with tokens from `constants/theme.js` — avoid raw hex values.
- Primary brand color: `#E55A28` (orange). Secondary/buttons: `#000000` (black).
- Component variants follow the `Button` pattern: `primary`, `secondary`, `outline`.
- Reusable components live in `components/common/` (exported via `index.js`) and `components/layouts/`.

### API Response Shape

All backend responses follow `{ success: boolean, payload: ..., message?: string }`. Screens check `response.data.success` before consuming `response.data.payload`.

### Local Development URLs

The active URLs are in `constants/config.js`. Commented-out lines show the LAN IP pattern for physical device testing — uncomment and substitute your IP when needed.
