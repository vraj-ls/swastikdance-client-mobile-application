Ask the user which platform they want to bump the version for, then update the relevant file(s).

Use the AskUserQuestion tool with:
- Question: "Which platform do you want to bump the version for?"
- Header: "Platform"
- Options:
  - "Android" — updates versionName and versionCode in android/app/build.gradle
  - "iOS" — updates CFBundleShortVersionString in ios/SwastikDance/Info.plist
  - "Both" — updates both files

Then ask: "What is the new version number? (e.g. 1.0.6)"

Steps after getting the answers:

**Android** (`android/app/build.gradle`):
- Find the line with `versionName "x.x.x"` and update it to the new version
- Also increment `versionCode` by 1 (it's an integer on the line just above versionName)

**iOS** (`ios/SwastikDance/Info.plist`):
- Find `<key>CFBundleShortVersionString</key>` and update the `<string>` on the next line to the new version

After updating, show the user:
- Which file(s) were changed
- Old version → new version for each
- Remind them: "Once submitted to the store, update the DB config keys `min_version_android` and/or `min_version_ios` to this version on the production MongoDB to force old users to update."
