# Gym Time

Gym Time is a mobile fitness application focused on workout tracking, personal records, progress monitoring, and habit building.

The app allows users to create routines, track workouts, monitor personal records, manage exercise libraries, and build long-term training consistency through weekly workout streaks.

## Features

### Workout Management

- Create and manage workout routines
- Add, edit, and reorder exercises
- Configure rest times between sets and exercises
- Start, resume, and discard active workouts
- Automatic workout recovery after app restart

### Workout Tracking

- Create and complete workout sessions
- Add, edit, and remove sets
- Track weight and repetitions
- Rest timer with background notifications
- Persistent active workout sessions

### Personal Records

- Automatic Personal Record (PR) detection
- Persistent PR storage per exercise
- Personal Record highlighting
- Personal Record sound notifications
- Progress history powered by exercise records

### Progress Tracking

- Exercise progress analytics
- Personal Records history
- Workout completion tracking
- Weekly streak system
- Training consistency metrics

### Exercise Library

- Browse exercises by muscle group
- Browse exercises by muscle region
- Search exercises
- Add exercises directly to routines or active workouts

### User Experience

- Background rest timer
- Local workout recovery
- Active workout banner
- Weekly streak notifications
- Customizable settings

## Weekly Workout Streaks

Gym Time tracks consistency using a weekly streak system.

A streak remains active as long as at least one workout is completed every week.

Examples:

- Week 1 → 1 workout
- Week 2 → 3 workouts
- Week 3 → 2 workouts

Result:

🔥 6 workouts completed in 3 weeks

Missing an entire week resets the streak.

## Technology Stack

### Mobile

- React Native
- Expo
- TypeScript

### Backend

- Supabase
- PostgreSQL

### Authentication

- Supabase Auth
- Email Verification

### State Management

- React Context
- React Hooks

### Notifications

- Expo Notifications

### Audio

- Expo Audio

### Navigation

- React Navigation

### Database

Core entities:

- profiles
- routines
- routine_exercises
- routine_exercise_sets
- workout_sessions
- workout_session_exercises
- workout_sets
- exercises
- muscles
- muscle_regions
- user_exercise_records
- user_workout_streaks
- user_settings

## Architecture

Routine Template

Routine
└── Routine Exercises
└── Routine Exercise Sets

Workout Execution

Workout Session
└── Workout Session Exercises
└── Workout Sets

Personal Records

User
└── Exercise Record
├── Best Volume
├── Best Weight
├── Best Reps
└── Best Set

## Current Features

- Authentication
- Routine Builder
- Exercise Management
- Workout Sessions
- Rest Timers
- Background Notifications
- Personal Records
- Weekly Streaks
- Progress Tracking
- User Settings

## Planned Features

### Near Term

- Profile Improvements
- Account Management
- Change Email
- Change Password
- Custom Verification Emails

### Future Releases

- AI Workout Generation
- AI Training Recommendations
- AI Progress Analysis
- Smart Routine Suggestions
- Weight Tracking
- Goal Tracking
- Advanced Analytics
- Offline First Synchronization

## License

Private project.

## Development Build

Gym Time uses an Expo Development Build instead of Expo Go because it relies on native modules.

### Create a new development build

Run this command whenever:

- A new native dependency is installed.
- An Expo native module is added or updated.
- Android or iOS native configuration changes.

```bash
eas build --profile development --platform android
```

Wait for the build to finish, then install the generated APK on your device.

### Start the development server

After installing the Development Build:

```bash
npx expo start --dev-client
```

### Rebuild required after installing native dependencies

The following packages require creating a new Development Build after installation:

- react-native-reanimated
- react-native-gesture-handler
- react-native-worklets
- react-native-draggable-flatlist
- Any Expo native module (expo-\* packages)

Simply restarting Metro is **not** enough after installing native dependencies.

### Account confirmation in Supabase

In **Authentication → URL Configuration**, add `gymtime://auth/confirm` to **Redirect URLs**. Set **Site URL** to `gymtime://auth/confirm` for the mobile-only deployment, or use the public Gym Time site if one is deployed. The app sends the exact mobile redirect explicitly when signing up.

In **Authentication → Email Templates → Confirm signup**, set the subject to `Gym Time | Confirmá tu correo / Confirm your email` and paste [the confirmation template](supabase/templates/confirmation.html). Send a new confirmation email after saving. Open the link on the device where you registered, with a native build that includes the `gymtime` scheme. You can also enter the one-time code in Gym Time on the sign-in screen.

Guest workouts and other guest data are stored on the device. On sign-in, the app attaches them to the account on that device. Guest routines enter the existing routine sync queue. Guest workout history, progress and preferences remain on that device.

### Google sign-in on Android

1. In Google Auth Platform, configure the OAuth consent screen for Gym Time.
   While it is in testing, add the Google accounts used by your testers.
2. Create a **Web application** OAuth client. Copy the callback URL from the
   Google provider page in Supabase into that client's authorized redirect URIs.
   Enable Google in Supabase Auth and enter the Web client ID and secret there.
3. Create an **Android** OAuth client with package `com.leandrocadena.gymtime`.
   For the Google Play internal track, use the SHA-1 under **App signing key
   certificate** in Play Console's **App integrity** screen. For a separately
   signed development APK, create an additional Android client for its SHA-1.
4. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the **Web** client ID in the EAS
   production environment and in your local environment when testing a native
   development build. The client secret belongs in Supabase only.
5. Build a new native Android app. In the installed build, go to **Profile →
   Sign in → Continue with Google**. Test cancellation, then sign in after
   saving a guest routine and confirm it remains visible.

The Google button appears on configured Android builds. Guest mode and the
existing email flow remain available during internal testing.
