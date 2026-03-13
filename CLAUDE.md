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

- **`services/authService.js`** — Singleton `AuthService` class. Also configures **global Axios interceptors** at module level (not in the constructor): request interceptor injects the Bearer token; response interceptor handles 401s by clearing auth and navigating to Login. The navigation ref must be set via `authService.setNavigationRef()` before interceptors can redirect. Also exposes inbox CRUD methods: `getInbox()`, `getMessage()`, `markMessageAsRead()`, `markMessageAsUnread()`, `deleteMessage()`, `markAllMessagesAsRead()`.
- **`services/notificationService.js`** — Singleton. Manages Firebase FCM token retrieval (native FCM, not Expo push service), Android notification channel creation, and foreground/background notification routing. On `initialize()`, it also calls `checkAndRegisterToken()` to silently re-register a stale or rotated FCM token for already-logged-in users. FCM background handler is registered at module scope in `index.js` (required by `@react-native-firebase/messaging` — must run before `registerRootComponent`).

### FCM / Push Notifications

Uses **`@react-native-firebase/messaging`** (native Firebase SDK, not Expo's push abstraction). The FCM token is sent to the backend at login time (`login(email, password, role, fcmToken)`). Notification taps deep-link into the app via `notificationService.navigateFromData()` using the `type` field in `data` payload (`STUDENT_WELCOME`, `SESSION_REMINDER`, `GENERAL`).

Foreground FCM messages are shown as in-app banners via `<InAppNotification>` rendered in `App.js` **outside** the `NavigationContainer` (as a sibling of `SafeAreaProvider`'s children).

### Key Files

| File | Purpose |
|------|---------|
| `index.js` | Entry point: registers FCM background/killed-state handler, then calls `registerRootComponent` |
| `App.js` | Root: navigation setup, foreground FCM listener, in-app notification banner |
| `constants/config.js` | `API_URL`, `WEB_APP_URL`, API endpoint paths, storage keys, validation limits |
| `constants/theme.js` | `colors`, `spacing`, `typography`, `borderRadius`, `shadows` design tokens |
| `services/authService.js` | All REST calls + Axios interceptors + JWT helpers + inbox API |
| `services/notificationService.js` | FCM token, notification listeners, tap routing |
| `hooks/useApi.js` | `useApi` (mutations, shows Alert on error) and `useFetch` (GET requests) hooks |
| `utils/formatters.js` | `formatDate`, `formatCurrency` |

### Styling Conventions

- All screens use `StyleSheet.create()` with tokens from `constants/theme.js` — avoid raw hex values.
- Primary brand color: `#E55A28` (orange). Secondary/buttons: `#000000` (black).
- Component variants follow the `Button` pattern: `primary`, `secondary`, `outline`.
- Reusable components live in `components/common/` (`Button`, `TextInput`, `InAppNotification` — exported via `index.js`) and `components/layouts/` (`BottomSheet`).
- Screen files use `.jsx` extension; service/hook/util files use `.js`.

### API Response Shape

All backend responses follow `{ success: boolean, payload: ..., message?: string }`. Screens check `response.data.success` before consuming `response.data.payload`.

### AsyncStorage Keys

`authService` uses hardcoded keys `'auth_token'` and `'auth_user'` — **not** the `STORAGE_KEYS` constants from `config.js`. `notificationService` uses `'fcm_token'` directly. The `STORAGE_KEYS` object in `config.js` is not wired up to the service layer and exists only as documentation.

### Local Development URLs

The active URLs are in `constants/config.js`. Commented-out lines show the LAN IP pattern for physical device testing — uncomment and substitute your IP when needed.
