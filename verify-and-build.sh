#!/bin/bash

echo "🔍 Pre-Build Verification"
echo "========================="
echo ""

# Check files exist
echo "📁 Checking Firebase files..."
if [ -f "google-services.json" ]; then
    echo "  ✓ google-services.json found ($(du -h google-services.json | cut -f1))"
else
    echo "  ✗ google-services.json NOT found"
    exit 1
fi

if [ -f "GoogleService-Info.plist" ]; then
    echo "  ✓ GoogleService-Info.plist found ($(du -h GoogleService-Info.plist | cut -f1))"
else
    echo "  ✗ GoogleService-Info.plist NOT found"
    exit 1
fi

echo ""

# Check if in .gitignore
echo "🔒 Checking .gitignore..."
if grep -q "google-services.json" .gitignore; then
    echo "  ⚠️  WARNING: Firebase files still in .gitignore!"
    echo "     Run: git add google-services.json GoogleService-Info.plist"
else
    echo "  ✓ Firebase files not in .gitignore (ready to commit)"
fi

echo ""

# Check git status
echo "📝 Checking git status..."
if git status --short | grep -q "google-services.json\|GoogleService-Info.plist"; then
    echo "  ⚠️  Firebase files not committed yet"
    echo ""
    echo "  Run these commands:"
    echo "    git add google-services.json GoogleService-Info.plist .gitignore"
    echo "    git commit -m 'Add Firebase config files'"
    echo ""
else
    if git ls-files --error-unmatch google-services.json >/dev/null 2>&1; then
        echo "  ✓ Firebase files committed to Git"
        echo ""
        echo "  🚀 Ready to build!"
        echo ""
        echo "  Run: eas build --platform android --profile preview"
    else
        echo "  ⚠️  Firebase files exist but not tracked by Git"
        echo "     Run: git add google-services.json GoogleService-Info.plist"
    fi
fi

echo ""
