#!/bin/bash

echo "🔐 Setting up EAS Secrets for Firebase Config Files"
echo "===================================================="
echo ""

# Check if files exist
if [ ! -f "google-services.json" ]; then
    echo "❌ Error: google-services.json not found!"
    echo "   Make sure the file exists in the current directory"
    exit 1
fi

if [ ! -f "GoogleService-Info.plist" ]; then
    echo "❌ Error: GoogleService-Info.plist not found!"
    echo "   Make sure the file exists in the current directory"
    exit 1
fi

echo "✅ Firebase config files found"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ Error: EAS CLI not installed"
    echo ""
    echo "Install with: npm install -g eas-cli"
    exit 1
fi

echo "✅ EAS CLI installed"
echo ""

# Check if logged in
echo "📝 Checking EAS login status..."
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to EAS"
    echo ""
    echo "Please run: eas login"
    exit 1
fi

echo "✅ Logged in to EAS"
echo ""

# Upload secrets
echo "📤 Uploading google-services.json to EAS Secrets..."
eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --force

echo ""
echo "📤 Uploading GoogleService-Info.plist to EAS Secrets..."
eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST --type file --value ./GoogleService-Info.plist --force

echo ""
echo "✅ Firebase config files uploaded as EAS Secrets!"
echo ""
echo "🚀 You can now build with:"
echo "   eas build --platform android --profile preview"
echo "   eas build --platform ios --profile preview"
echo ""
