# Polka Mobile

<p align="center">
  <img src="app/assets/Logo.svg" alt="Polka Logo" width="150" />
</p>

<p align="center">
  A premium mobile shopping experience built with React Native and Expo
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.76-blue" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-52.0-blueviolet" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-Custom%20Non--Commercial-red" alt="License" />
</p>

## ✨ Features

Polka Mobile is a sophisticated shopping application with a focus on elegant UI design and smooth, responsive animations.

- **Beautiful UI Design**

  - Custom gradient backgrounds throughout the app
  - Elegant animations and transitions between screens
  - Custom SVG icons and premium visual elements
  - Responsive layouts for various device sizes

- **Advanced Authentication System**

  - Secure login and registration with form validation
  - Persistent authentication using AsyncStorage
  - Beautiful loading animations during authentication flow
  - Seamless transition between authentication states

- **Shopping Experience**

  - Card-based product browsing with swipe interactions
  - Heart/like functionality with beautiful animations
  - Size selection with elegant transition animations
  - Quick add-to-cart with haptic feedback

- **Shopping Cart**

  - Persistent cart that saves between app sessions
  - Quantity adjustment with real-time updates
  - Clear cart on logout for data privacy
  - Beautiful item presentation with images and details

- **Favorites & Search**
  - Save favorite items for later browsing
  - Comprehensive search functionality
  - Smooth transitions and loading states
  - Interactive UI elements with haptic feedback

## 📱 App Showcase

<p align="center">
  <img src="https://via.placeholder.com/220x440?text=Welcome+Screen" alt="Welcome Screen" width="220" />
  <img src="https://via.placeholder.com/220x440?text=Main+Screen" alt="Main Screen" width="220" /> 
  <img src="https://via.placeholder.com/220x440?text=Cart+Screen" alt="Cart Screen" width="220" />
</p>

## 🛠️ Technology Stack

- **Frontend**

  - [React Native](https://reactnative.dev/) - Core framework
  - [Expo](https://expo.dev/) - Development platform
  - [TypeScript](https://www.typescriptlang.org/) - Type safety
  - [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) - Advanced animations
  - [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) - Touch handling
  - [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) - Gradient effects
  - [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) - Haptic feedback
  - [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) - Local data persistence

- **Design & Assets**
  - Custom SVG icons
  - Custom fonts
  - Linear gradients for sophisticated UI
  - Dynamic animations

## 🚀 Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/polka-mobile.git
   cd polka-mobile
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the application**

   ```bash
   npm start
   ```

4. **Run on a device or emulator**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## 📁 Project Structure

```
polka-mobile/
├── App.tsx               # Main app component
├── app/                  # App components and modules
│   ├── assets/           # Images, icons, and fonts
│   │   ├── fonts/        # Custom fonts
│   │   └── ...           # SVG icons and images
│   ├── screens/          # App screens
│   │   ├── WelcomeScreen.tsx  # Welcome/login/signup entry
│   │   ├── LoginScreen.tsx    # User login screen
│   │   └── SignupScreen.tsx   # User registration screen
│   ├── cartStorage.ts    # Cart data persistence
│   ├── MainPage.tsx      # Product browsing screen
│   ├── Cart.tsx          # Shopping cart screen
│   ├── Search.tsx        # Search functionality
│   ├── Favorites.tsx     # Saved favorites
│   └── Settings.tsx      # User settings
└── ...
```

## 🎨 UI/UX Highlights

- **Interactive Button Effects**

  - Spinning gradient borders with acceleration/deceleration
  - Scale animations with haptic feedback
  - Custom gradient borders and backgrounds

- **Seamless Transitions**

  - Smooth animations between screens
  - Loading animations with elegant timing
  - Card swiping interactions

- **Premium Design Elements**
  - Custom font integration
  - SVG icon animations
  - Layered gradients for depth
  - Consistent design language

## 🔐 Authentication Flow

The app features a professional authentication system that securely stores user data using AsyncStorage:

1. Initial loading with the app logo
2. Authentication check during startup
3. Welcome screen for non-authenticated users
4. Login/Signup options with form validation
5. Seamless transition to main app after authentication
6. Persistent login state between app sessions
7. Secure logout with cart clearing

## 🛒 Cart System

The shopping cart system features:

1. Persistent storage using AsyncStorage
2. Automatic saving of cart items between sessions
3. Quantity adjustment with animated UI
4. Clean wiping of cart data on logout
5. Automatic navigation to cart after adding items

## 🧩 Future Enhancements

- Backend integration with a real product API
- Push notifications for order updates
- User profile management
- Payment gateway integration
- Delivery tracking
- Social sharing features

## 📄 License

This project is licensed under a Custom Non-Commercial License - see the [LICENSE](LICENSE) file for details.

**Key points:**

- ✅ You may use, modify, and distribute this software for personal and educational purposes
- ❌ Commercial use is strictly prohibited without explicit permission
- ❌ Selling or sublicensing this software or derivatives is not allowed

For commercial licensing inquiries, please contact the repository owner.

## 👥 Contributors

- [Daniel Igoshin](https://github.com/Xeryto) - Developer

---

<p align="center">Made with ❤️ using React Native and Expo</p>
