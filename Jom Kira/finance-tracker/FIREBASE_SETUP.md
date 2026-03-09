# Firebase Setup Guide

This guide will walk you through setting up Firebase for your Finance Tracker app.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `finance-tracker` (or any name you prefer)
4. Click "Continue"
5. Disable Google Analytics (optional, you can enable it if you want)
6. Click "Create project"
7. Wait for the project to be created, then click "Continue"

## Step 2: Enable Authentication

1. In the Firebase Console, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Click on the "Sign-in method" tab
4. Click on "Email/Password"
5. Toggle "Enable" to ON
6. Click "Save"

## Step 3: Create Realtime Database

1. In the Firebase Console, click on "Realtime Database" in the left sidebar
2. Click "Create Database"
3. Select a location (choose the one closest to you)
4. Start in **test mode** for now (we'll secure it later)
5. Click "Enable"

## Step 4: Set Database Rules (Important!)

1. In the Realtime Database page, click on the "Rules" tab
2. Replace the rules with the following:

```json
{
  "rules": {
    "transactions": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

3. Click "Publish"

This ensures that users can only read and write their own transactions.

## Step 5: Get Your Firebase Configuration

1. Click on the gear icon (⚙️) next to "Project Overview" in the left sidebar
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click on the Web icon (`</>`) to add a web app
5. Enter app nickname: `Finance Tracker Web`
6. Click "Register app"
7. You'll see a `firebaseConfig` object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

8. Copy this entire object

## Step 6: Update Your App Configuration

1. Open `firebase.config.js` in your project
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
  databaseURL: "YOUR_ACTUAL_DATABASE_URL",
  projectId: "YOUR_ACTUAL_PROJECT_ID",
  storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
  messagingSenderId: "YOUR_ACTUAL_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID"
};
```

3. Save the file

## Step 7: Test Your Setup

1. Start your app: `npx expo start`
2. Open the app on your phone using Expo Go
3. Try to register a new account
4. If successful, you should be able to login and use the app!

## Verify Database Connection

1. Add a transaction in your app
2. Go back to Firebase Console > Realtime Database
3. You should see your transaction data appear under `transactions/[your-user-id]/`

## Security Best Practices

### For Production:

1. **Never commit your Firebase config to public repositories**
   - Add `firebase.config.js` to `.gitignore` if sharing code
   - Use environment variables for sensitive data

2. **Strengthen Database Rules**
   - The current rules allow authenticated users to read/write their own data
   - This is secure for personal use

3. **Enable App Check** (Optional, for production)
   - Protects your backend resources from abuse
   - Go to Firebase Console > App Check
   - Follow the setup instructions

## Troubleshooting

### "Firebase: Error (auth/network-request-failed)"
- Check your internet connection
- Verify your Firebase config is correct

### "Permission denied"
- Make sure you've updated the database rules
- Verify you're logged in

### "Database URL not found"
- Make sure you've created a Realtime Database
- Check that `databaseURL` in your config is correct

### Data not syncing
- Check Firebase Console to see if data is being written
- Verify database rules allow read/write access
- Check your internet connection

## Next Steps

Once Firebase is set up:
1. Test the app thoroughly
2. Add transactions and verify they sync
3. Test on multiple devices to verify cross-device sync
4. Consider building a standalone app for distribution

## Support

If you encounter issues:
- Check [Firebase Documentation](https://firebase.google.com/docs)
- Review the [Firebase Console](https://console.firebase.google.com/)
- Ensure all steps above were completed correctly
