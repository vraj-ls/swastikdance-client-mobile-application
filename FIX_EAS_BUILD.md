# Fix EAS Build - Firebase Files Issue

## The Problem

EAS Build can't access `google-services.json` and `GoogleService-Info.plist` because they're in `.gitignore`.

## The Solution (Choose One)

### ✅ Option 1: Commit Firebase Files (RECOMMENDED - Simplest)

Firebase config files are **meant to be client-side** and it's safe to commit them:
- They contain public API keys (designed to be in client apps)
- Security comes from Firebase Security Rules, not from hiding files
- This is the standard practice for mobile apps

**Steps:**

1. **Remove from .gitignore:**
   ```bash
   # Edit .gitignore and remove these lines:
   # google-services.json
   # GoogleService-Info.plist
   ```

2. **Commit the files:**
   ```bash
   git add google-services.json GoogleService-Info.plist
   git commit -m "Add Firebase config files for mobile app"
   git push
   ```

3. **Rebuild:**
   ```bash
   eas build --platform android --profile preview
   ```

✅ **Pros:** Simple, standard practice, works immediately
❌ **Cons:** Files visible in repo (but this is normal and safe)

---

### Option 2: Use EAS Secrets with app.config.js (Advanced)

If you really want to keep files out of Git, use environment variables.

**Steps:**

1. **Create `app.config.js`:**
   ```javascript
   module.exports = {
     expo: {
       // ... copy all from app.json
       android: {
         googleServicesFile: process.env.GOOGLE_SERVICES_JSON || './google-services.json'
       },
       ios: {
         googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST || './GoogleService-Info.plist'
       }
     }
   };
   ```

2. **Upload as base64 secrets:**
   ```bash
   # Convert to base64
   cat google-services.json | base64 > google-services.json.b64
   cat GoogleService-Info.plist | base64 > GoogleService-Info.plist.b64

   # Upload
   eas secret:create --scope project --name GOOGLE_SERVICES_JSON_BASE64 --value "$(cat google-services.json.b64)"
   eas secret:create --scope project --name GOOGLE_SERVICE_INFO_PLIST_BASE64 --value "$(cat GoogleService-Info.plist.b64)"
   ```

3. **Add EAS Build hook to decode:**
   Create `.eas/build/prebuild.sh`

✅ **Pros:** Files not in Git
❌ **Cons:** Complex, requires maintenance, non-standard

---

### Option 3: Use .easignore (Quick Fix)

Create `.easignore` file to override `.gitignore` for EAS builds:

```bash
# Create .easignore (empty or with other exclusions)
touch .easignore

# This tells EAS to ignore .gitignore and upload everything
```

✅ **Pros:** Quick, minimal changes
❌ **Cons:** EAS will upload ALL files, including node_modules if not careful

---

## 🎯 Recommended Approach

**Use Option 1** - Commit the Firebase files:

```bash
# 1. Edit .gitignore - remove these lines:
code .gitignore
# Delete:
#   google-services.json
#   GoogleService-Info.plist

# 2. Commit files
git add google-services.json GoogleService-Info.plist .gitignore
git commit -m "Add Firebase config files for EAS Build"
git push

# 3. Rebuild
eas build --platform android --profile preview
```

**Why this is safe:**
- Firebase API keys are designed to be public (client-side)
- Real security comes from Firebase Security Rules
- This is standard practice (check any React Native Firebase tutorial)
- Google's official documentation shows committing these files

---

## 🔒 Security Note

**What's Actually Sensitive:**
- ❌ Backend service account keys (e.g., `firebase-adminsdk-xxxxx.json`)
- ❌ Database passwords, API secrets
- ❌ Private keys (.p12, .key files)

**What's Safe to Commit:**
- ✅ `google-services.json` (Android Firebase config)
- ✅ `GoogleService-Info.plist` (iOS Firebase config)
- ✅ Expo app.json configuration

These files are meant to be bundled with your app, so they're already "public" once you distribute your app.

---

## Quick Fix Commands

```bash
# Remove from .gitignore
sed -i.bak '/google-services.json/d' .gitignore
sed -i.bak '/GoogleService-Info.plist/d' .gitignore

# Commit
git add google-services.json GoogleService-Info.plist .gitignore
git commit -m "Add Firebase config files"

# Build
eas build --platform android --profile preview
```

Done! 🚀
