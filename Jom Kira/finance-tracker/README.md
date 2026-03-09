# Finance Tracker Mobile App

A cross-platform personal finance tracking mobile app built with React Native and Firebase.

## Features

- 📱 Cross-platform (iOS & Android)
- 🔐 User authentication with Firebase
- 💰 Track income and expenses
- 📊 Category-based organization
- 📈 Visual analytics with charts
- 🔄 Real-time sync across devices
- 💾 Offline support
- 🎨 Modern, beautiful UI

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo Go app on your phone (for testing)

### 1. Install Dependencies

```bash
cd finance-tracker
npm install
```

### 2. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
4. Enable Realtime Database:
   - Go to Realtime Database
   - Create database in test mode
5. Get your config:
   - Go to Project Settings > General
   - Scroll to "Your apps" section
   - Click on Web app (</>) icon
   - Copy the firebaseConfig object

6. Update `firebase.config.js`:
   - Replace the placeholder values with your Firebase config

### 3. Run the App

```bash
# Start the development server
npx expo start
```

This will show a QR code in your terminal.

### 4. Test on Your Phone

**Option 1: Using Expo Go (Recommended for testing)**
1. Install "Expo Go" app from App Store (iOS) or Play Store (Android)
2. Scan the QR code from the terminal
3. The app will load on your phone

**Option 2: Build Standalone App**
```bash
# For Android
npx expo build:android

# For iOS (requires Apple Developer account)
npx expo build:ios
```

## Project Structure

```
finance-tracker/
├── screens/           # App screens
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   ├── HomeScreen.js
│   ├── AddTransactionScreen.js
│   ├── TransactionsScreen.js
│   └── AnalyticsScreen.js
├── services/          # Business logic
│   ├── transactionService.js
│   └── analyticsService.js
├── utils/             # Utilities
│   └── categories.js
├── styles/            # Styling
│   ├── theme.js
│   └── globalStyles.js
├── firebase.config.js # Firebase configuration
└── App.js            # Main app entry point
```

## Usage

1. **Register/Login**: Create an account or login
2. **Add Transactions**: Use the + button to add income or expenses
3. **View Transactions**: See all your transactions in the Transactions tab
4. **Analytics**: View spending insights and charts in the Analytics tab
5. **Sync**: All data automatically syncs across your devices

## Categories

### Expense Categories
- Food & Dining
- Transportation
- Shopping
- Bills & Utilities
- Entertainment
- Health & Fitness
- Education
- Travel
- Gifts & Donations
- Personal Care
- Home & Garden
- Other

### Income Categories
- Salary
- Business
- Investment
- Freelance
- Bonus
- Gift Received
- Refund
- Other Income

## Technologies Used

- **React Native** - Mobile framework
- **Expo** - Development platform
- **Firebase** - Backend (Auth + Realtime Database)
- **React Navigation** - Navigation
- **React Native Chart Kit** - Charts and graphs
- **AsyncStorage** - Offline storage

## Troubleshooting

### Firebase Connection Issues
- Make sure you've replaced the placeholder values in `firebase.config.js`
- Check that Authentication and Realtime Database are enabled in Firebase Console

### App Not Loading
- Clear Expo cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Sync Not Working
- Check your internet connection
- Verify Firebase Realtime Database rules allow read/write access

## License

MIT
