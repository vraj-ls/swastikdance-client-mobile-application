#!/bin/bash

echo "🔥 Firebase Configuration Checker"
echo "================================="
echo ""

# Check app.json configuration
echo "✅ Checking app.json configuration..."
if grep -q "com.swastikdance.mobile" app.json; then
    echo "   ✓ Package identifiers configured"
else
    echo "   ✗ Package identifiers not found"
fi

if grep -q "googleServicesFile" app.json; then
    echo "   ✓ Firebase file paths configured"
else
    echo "   ✗ Firebase file paths not configured"
fi

echo ""

# Check for Firebase config files
echo "📱 Checking Firebase config files..."

if [ -f "google-services.json" ]; then
    echo "   ✓ google-services.json found (Android)"

    # Check if it's the real file or template
    if grep -q "YOUR_PROJECT_ID" google-services.json; then
        echo "   ⚠️  WARNING: This appears to be a template file!"
        echo "      Download the real file from Firebase Console"
    fi
else
    echo "   ✗ google-services.json NOT found (Android)"
    echo "      Download from: https://console.firebase.google.com"
    echo "      Place in: $(pwd)"
fi

echo ""

if [ -f "GoogleService-Info.plist" ]; then
    echo "   ✓ GoogleService-Info.plist found (iOS)"

    # Check if it's the real file or template
    if grep -q "YOUR_PROJECT_ID" GoogleService-Info.plist; then
        echo "   ⚠️  WARNING: This appears to be a template file!"
        echo "      Download the real file from Firebase Console"
    fi
else
    echo "   ✗ GoogleService-Info.plist NOT found (iOS)"
    echo "      Download from: https://console.firebase.google.com"
    echo "      Place in: $(pwd)"
fi

echo ""

# Check .gitignore
echo "🔒 Checking .gitignore..."
if grep -q "google-services.json" .gitignore; then
    echo "   ✓ Firebase files are in .gitignore (secure)"
else
    echo "   ⚠️  WARNING: Firebase files should be in .gitignore!"
    echo "      Run: echo 'google-services.json' >> .gitignore"
    echo "      Run: echo 'GoogleService-Info.plist' >> .gitignore"
fi

echo ""

# Check dependencies
echo "📦 Checking dependencies..."
if grep -q "expo-notifications" package.json; then
    echo "   ✓ expo-notifications installed"
else
    echo "   ✗ expo-notifications not found"
    echo "      Run: npm install expo-notifications"
fi

if grep -q "expo-device" package.json; then
    echo "   ✓ expo-device installed"
else
    echo "   ✗ expo-device not found"
    echo "      Run: npm install expo-device"
fi

if grep -q "expo-constants" package.json; then
    echo "   ✓ expo-constants installed"
else
    echo "   ✗ expo-constants not found"
    echo "      Run: npm install expo-constants"
fi

echo ""

# Summary
echo "📊 Summary"
echo "=========="

FIREBASE_FILES_EXIST=false
if [ -f "google-services.json" ] && [ -f "GoogleService-Info.plist" ]; then
    FIREBASE_FILES_EXIST=true
fi

if [ "$FIREBASE_FILES_EXIST" = true ]; then
    echo ""
    echo "✅ READY FOR PRODUCTION BUILD!"
    echo ""
    echo "You can now build standalone apps with:"
    echo "  eas build --platform android"
    echo "  eas build --platform ios"
    echo ""
else
    echo ""
    echo "✅ READY FOR DEVELOPMENT WITH EXPO GO!"
    echo ""
    echo "You can test now without Firebase files:"
    echo "  npm start"
    echo "  (Scan QR with Expo Go)"
    echo ""
    echo "⏳ For production builds, download Firebase config files from:"
    echo "   https://console.firebase.google.com"
    echo ""
    echo "See FIREBASE_SETUP_GUIDE.md for detailed instructions."
    echo ""
fi
