# 📚 EasyReads

EasyReads is a mindful reading companion and habit tracker built with **React Native** and **Expo (SDK 56)**. It is designed to help readers build consistent, stress-free reading habits through dynamic smart goals, streak protection, dictionary integrations, and milestone celebrations.

---

## ✨ Features

- **📖 Active Book Tracker**: Monitor your current book, track pages read, and visualize progress with a beautifully styled custom progress bar.
- **🎯 Smart Goal Engine**: A dynamic system that adjusts your daily reading goal. If you log below your baseline goal (default: 15 pages/day) for 3 consecutive days, the app automatically scales the goal down to keep it achievable and stress-free. Logging at or above baseline restores your default goal.
- **❄️ Habit Streak & Streak Freeze**: Tracks your daily reading habit streak. If you miss a day, the app automatically consumes a *Streak Freeze* token (up to 2 available) to protect your streak and displays a warm notification banner.
- **🔍 Quick Dictionary Lookup**: Real-time word search integration using the *Free Dictionary API* (with a robust offline/local fallback dictionary).
- **🎨 Social Share Card Generator**: Transform any looked-up word and definition into a premium, gold-trimmed quote card ready to be shared with friends.
- **🏆 Pehla Kitaab (First Book Certificate)**: An elegant, full-screen digital certificate complete with elegant corner ornaments and a mindful reading quote to celebrate completing your very first book.
- **⚙️ Interactive Simulation Panel**: A built-in developer control panel that allows you to instantly simulate streak freezes, low-activity goals, and resets to test edge-case states.

---

## 🛠️ Technology Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 56.0.x)
- **Runtime**: React Native (0.85.x) & React (19.2.x)
- **Layout & Safe Area**: `react-native-safe-area-context`
- **Language**: TypeScript
- **Icons**: `@expo/vector-icons` (Ionicons)
- **State Management**: React Context API
---

## 📂 Project Structure

```text
easyread/
├── assets/                  # App icons, splash screens, and adaptive assets
├── components/              # Reusable UI component sheets and modals
│   ├── CelebrationModal.tsx      # Certificate of first book completion
│   ├── SimulationControls.tsx    # Interactive developer panel
│   ├── UpdateProgressModal.tsx   # Progress logger sheet
│   └── VocabLookupModal.tsx      # Dictionary search & share card generator
├── constants/
│   └── theme.ts             # Global design tokens (colors, spacings, fonts)
├── context/
│   └── ReadingContext.tsx   # Core reading, smart goals, and simulation state provider
├── screens/
│   └── DashboardScreen.tsx  # Main application layout and dashboard
├── App.tsx                  # Root component wrapping state provider and UI
├── App.json                 # Expo configuration metadata
├── tsconfig.json            # TypeScript compiler configuration
└── package.json             # Dependencies and build scripts
```

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Run the Development Server
Start the Metro bundler:
```bash
npm start
```

### 3. Open the App
- Scan the printed QR code with your device using **Expo Go** (iOS Camera or Android Expo Go App).
- Or run on an emulator:
  - Press `a` for Android Emulator.
  - Press `i` for iOS Simulator.
  - Press `w` for Web (requires `react-native-web` and `react-dom` dependencies).

---

## 🧪 Simulation Controls (Testing Core Engines)

Use the expandable **Interactive Simulation Panel** at the bottom of the dashboard screen to run the following scenarios:
1. **Simulate Skipping a Day**: Tests the Streak Freeze protection system. It will consume a token, preserve your streak, and show a protection banner at the top of the dashboard.
2. **Simulate 3 Low Entries**: Populates 3 days of low-page logs below the 15-page baseline, triggering the Smart Goal engine to scale down your goal (e.g. from 15 to 13 pages).
3. **Reset Simulation State**: Restores all profiles, book statistics, and logs back to initial mock presets.
