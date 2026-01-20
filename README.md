# Swastik Dance Mobile App

React Native mobile application built with Expo for Swastik Institute of Dance customer portal.

## Overview

This mobile app provides native authentication screens (Login, Register, Forgot Password) and a WebView to display the customer portal dashboard after successful authentication.

## Tech Stack

- **React Native** with Expo SDK 54
- **React Navigation** - Native Stack Navigator
- **AsyncStorage** - Token persistence
- **WebView** - Display web portal after authentication
- **Axios** - REST API calls

## Architecture

```
Mobile App Flow:
├── Native Auth Screens (Login, Register, Forgot Password)
│   ↓
├── REST API (/mobile/login, /mobile/register, /mobile/forgot-password)
│   ↓
├── JWT Token Storage (AsyncStorage)
│   ↓
└── WebView (https://app.swastikdance.com.au/mobile-auth?token=JWT)
    ↓
    Web Portal Dashboard
```

## Project Structure

```
swastikdance-mobile-expo/
├── screens/
│   ├── LoginScreen.js           # Native login screen
│   ├── RegisterScreen.js        # Native registration screen
│   ├── ForgotPasswordScreen.js  # Native forgot password screen
│   └── WebViewScreen.js         # WebView container
├── services/
│   └── authService.js           # API service for authentication
├── App.js                       # Main navigation setup
└── app.json                     # Expo configuration
```

## Setup

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Studio (for Android development)

### Installation

1. Navigate to the mobile app directory:
```bash
cd swastikdance-mobile-expo
```

2. Install dependencies (already done during setup):
```bash
npm install
```

3. Update API URL in `services/authService.js`:
```javascript
const API_URL = 'YOUR_API_URL/mobile';
```

4. Update WebView URL in `screens/WebViewScreen.js`:
```javascript
const WEB_APP_URL = 'YOUR_WEB_APP_URL';
```

### Running the App

#### Development

```bash
# Start Expo development server
npm start

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

#### Using Expo Go App

1. Install Expo Go on your physical device:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Scan the QR code from the terminal with:
   - iOS: Camera app
   - Android: Expo Go app

### Building for Production

```bash
# Build for iOS (requires Apple Developer account)
expo build:ios

# Build for Android
expo build:android

# Alternative: Use EAS Build (recommended)
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

## Configuration

### Environment-Specific URLs

Update these URLs based on your environment:

**Development (localhost):**
- API: `http://localhost:3001/mobile`
- Web App: `http://localhost:3002`

**Production:**
- API: `https://api.swastikdance.com.au/mobile`
- Web App: `https://app.swastikdance.com.au`

### Network Configuration for Local Development

If testing on a physical device with localhost:

1. Find your computer's local IP address:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. Update URLs in code:
   ```javascript
   const API_URL = 'http://192.168.1.X:3001/mobile';
   const WEB_APP_URL = 'http://192.168.1.X:3002';
   ```

3. Ensure your server allows connections from your local network

## Features

### Authentication

- **Login**: Email/password authentication via REST API
- **Register**: Create new customer account with auto-generated password
- **Forgot Password**: Email-based password reset
- **Persistent Session**: Token stored in AsyncStorage

### WebView Dashboard

- Automatically logs user into web portal using token
- Full access to customer portal features
- Logout functionality with confirmation

### UI/UX

- Matches web portal design (Tailwind CSS colors)
- Primary color: `#FF10F0` (pink/magenta)
- Clean, modern interface
- Loading states and error handling
- Responsive design

## API Endpoints Used

All endpoints are at `BASE_URL/mobile`:

- `POST /mobile/login` - User authentication
- `POST /mobile/register` - New user registration
- `POST /mobile/forgot-password` - Password reset
- `POST /mobile/logout` - Logout (optional, clears local storage)

## Dependencies

```json
{
  "@react-native-async-storage/async-storage": "^2.1.0",
  "@react-native-picker/picker": "^2.10.1",
  "@react-navigation/native": "^7.0.17",
  "@react-navigation/native-stack": "^7.3.0",
  "axios": "^1.7.9",
  "expo": "~54.0.0",
  "react": "18.3.1",
  "react-native": "0.76.5",
  "react-native-safe-area-context": "^4.14.0",
  "react-native-screens": "^4.5.0",
  "react-native-webview": "^13.12.6"
}
```

## Troubleshooting

### WebView not loading

1. Check network connectivity
2. Verify API_URL and WEB_APP_URL are correct
3. Ensure server is running and accessible
4. Check CORS settings on server

### Login failing

1. Verify server is running at API_URL
2. Check server logs for errors
3. Ensure Mailchimp/Stripe credentials are configured
4. Test API endpoints with curl

### Token not persisting

1. Clear AsyncStorage: Uninstall and reinstall the app
2. Check AsyncStorage permissions
3. Verify authService.js is correctly storing/retrieving token

## Next Steps

- [ ] Add biometric authentication (Face ID/Touch ID)
- [ ] Implement push notifications
- [ ] Add offline support
- [ ] Create custom splash screen and app icons
- [ ] Add analytics tracking
- [ ] Implement deep linking

## Contributing

See main repository [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## Support

For technical issues, refer to the main repository documentation:
- [Server API Documentation](../swastikdance-server-express/CLAUDE.md)
- [Client Portal Documentation](../swastikdance-client-react/)

## License

Proprietary - All rights reserved
