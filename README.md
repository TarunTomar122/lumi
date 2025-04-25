# Lumi Mobile

A smart task management and reminder app with an AI assistant. Lumi helps you stay organized through natural language conversations - just tell Lumi what you need, and it will handle your tasks, reminders, and calendar management intelligently.

## Features

- **AI Assistant**
  - Natural language interface for all app functions
  - Have conversations about your tasks and schedule
  - Ask Lumi to create tasks, set reminders, or check your calendar
  - Get intelligent suggestions based on your schedule and preferences
  - Voice input support for hands-free interaction

- **Task Management**
  - Create, edit, and delete tasks through chat or UI
  - Categorize tasks with priorities (low, medium, high)
  - Track task status (todo, in progress, done)
  - Custom categories for better organization
  - Let Lumi suggest optimal times for your tasks

- **Smart Reminders**
  - Set up notifications by simply telling Lumi when to remind you
  - Local notifications that work even when the app is in background
  - Reliable scheduling system using Notifee
  - Natural language time parsing ("remind me tomorrow afternoon")

- **Google Calendar Integration**
  - View your busy slots from Google Calendar
  - Smart scheduling around your existing calendar events
  - Ask Lumi to find free time in your schedule
  - Seamless sync with your Google account

- **Local Storage**
  - All tasks and reminders stored locally using SQLite
  - Works offline
  - Fast and reliable data access
  - Privacy-focused: your data stays on your device

## How It Works

Lumi combines the power of natural language processing with practical task management. Here are some things you can say to Lumi:

- "Create a task to buy groceries tomorrow afternoon"
- "Remind me to call mom on Sunday at 6 PM"
- "Show me my tasks for today"
- "When am I free tomorrow?"
- "Mark the grocery task as done"
- "Move my evening tasks to tomorrow, I'm busy today"

Lumi understands context and can handle follow-up questions, making it feel like chatting with a helpful assistant rather than using a traditional task app.

## Tech Stack

- React Native with Expo
- TypeScript for type safety
- SQLite for local storage
- Notifee for reliable notifications
- Google Sign-in for calendar integration
- React Navigation for routing
- Voice recognition for speech input
- Natural language processing for understanding user intent

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- Yarn package manager
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio & Android SDK (for Android development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ttarunn/lumi-mobile.git
cd lumi-mobile
```

2. Install dependencies:
```bash
yarn install
```

3. Install iOS pods (if developing for iOS):
```bash
cd ios && pod install && cd ..
```

4. Start the development server:
```bash
yarn start
```

### Running the App

- For iOS:
```bash
yarn ios
```

- For Android:
```bash
yarn android
```

## Project Structure

```
lumi-mobile/
├── app/                   # App screens and navigation
├── assets/               # Static assets
├── components/           # Reusable React components
├── config/              # Configuration files
├── hooks/               # Custom React hooks
│   └── useVoiceRecognition.ts  # Voice input hook
├── utils/               # Utility functions and helpers
│   ├── database.ts     # SQLite database management
│   ├── tools.ts        # Core functionality and tools
│   └── calendar.ts     # Calendar integration
└── types/               # TypeScript type definitions
```

## Environment Setup

1. Create a `.env` file in the root directory with your Google OAuth credentials:
```env
GOOGLE_WEB_CLIENT_ID=798027807322-q1gtt0su6gttcqrmgit6lrsl2d188oaj.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=798027807322-q1gtt0su6gttcqrmgit6lrsl2d188oaj.apps.googleusercontent.com
```

2. For Android, ensure you have the following permissions in your `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
```

## Privacy Policy

For information about how we handle your data and protect your privacy, please see our [Privacy Policy](privacy-policy.md).

## Contact

Tarun Singh Tomar - [tomartarun2001@gmail.com](mailto:tomartarun2001@gmail.com)
Website: [tarat.space](https://tarat.space)
Project Link: [https://github.com/ttarunn/lumi-mobile](https://github.com/ttarunn/lumi-mobile)

## Acknowledgments

- [Notifee](https://notifee.app/) for the excellent notification system
- [React Native SQLite Storage](https://github.com/andpor/react-native-sqlite-storage) for local database management
- [Google Calendar API](https://developers.google.com/calendar) for calendar integration
- [@react-native-voice/voice](https://github.com/react-native-voice/voice) for voice recognition capabilities
