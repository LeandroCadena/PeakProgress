# PeakProgress

PeakProgress is a mobile fitness application focused on workout tracking, personal records, progress monitoring, and habit building.

The app allows users to create routines, track workouts, monitor personal records, manage exercise libraries, and build long-term training consistency through weekly workout streaks.

## Features

### Workout Management

* Create and manage workout routines
* Add, edit, and reorder exercises
* Configure rest times between sets and exercises
* Start, resume, and discard active workouts
* Automatic workout recovery after app restart

### Workout Tracking

* Create and complete workout sessions
* Add, edit, and remove sets
* Track weight and repetitions
* Rest timer with background notifications
* Persistent active workout sessions

### Personal Records

* Automatic Personal Record (PR) detection
* Persistent PR storage per exercise
* Personal Record highlighting
* Personal Record sound notifications
* Progress history powered by exercise records

### Progress Tracking

* Exercise progress analytics
* Personal Records history
* Workout completion tracking
* Weekly streak system
* Training consistency metrics

### Exercise Library

* Browse exercises by muscle group
* Browse exercises by muscle region
* Search exercises
* Add exercises directly to routines or active workouts

### User Experience

* Background rest timer
* Local workout recovery
* Active workout banner
* Weekly streak notifications
* Customizable settings

## Weekly Workout Streaks

PeakProgress tracks consistency using a weekly streak system.

A streak remains active as long as at least one workout is completed every week.

Examples:

* Week 1 → 1 workout
* Week 2 → 3 workouts
* Week 3 → 2 workouts

Result:

🔥 6 workouts completed in 3 weeks

Missing an entire week resets the streak.

## Technology Stack

### Mobile

* React Native
* Expo
* TypeScript

### Backend

* Supabase
* PostgreSQL

### Authentication

* Supabase Auth
* Email Verification

### State Management

* React Context
* React Hooks

### Notifications

* Expo Notifications

### Audio

* Expo Audio

### Navigation

* React Navigation

### Database

Core entities:

* profiles
* routines
* routine_exercises
* routine_exercise_sets
* workout_sessions
* workout_session_exercises
* workout_sets
* exercises
* muscles
* muscle_regions
* user_exercise_records
* user_workout_streaks
* user_settings

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

* Authentication
* Routine Builder
* Exercise Management
* Workout Sessions
* Rest Timers
* Background Notifications
* Personal Records
* Weekly Streaks
* Progress Tracking
* User Settings

## Planned Features

### Near Term

* Profile Improvements
* Account Management
* Change Email
* Change Password
* Custom Verification Emails

### Future Releases

* AI Workout Generation
* AI Training Recommendations
* AI Progress Analysis
* Smart Routine Suggestions
* Weight Tracking
* Goal Tracking
* Advanced Analytics
* Offline First Synchronization

## License

Private project.
