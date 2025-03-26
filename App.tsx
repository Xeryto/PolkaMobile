import React, { useState, useEffect, useRef } from 'react';
import * as Font from 'expo-font';
import { StatusBar, Pressable, SafeAreaView, StyleSheet, Text, View, Animated, Dimensions, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MainPage from './app/MainPage';
import CartPage from './app/Cart';
import SearchPage from './app/Search';
import FavoritesPage from './app/Favorites';
import SettingsPage from './app/Settings';
import LoadingScreen from './app/LoadingScreen';
import AuthLoadingScreen from './app/AuthLoadingScreen';
import SimpleAuthLoadingScreen from './app/SimpleAuthLoadingScreen';
import WelcomeScreen from './app/screens/WelcomeScreen';
import ConfirmationScreen from './app/screens/ConfirmationScreen';
import BrandSearchScreen from './app/screens/BrandSearchScreen';
import StylesSelectionScreen from './app/screens/StylesSelectionScreen';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as cartStorage from './app/cartStorage';
import * as api from './app/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Cart from './app/assets/Cart.svg'; // Adjust the path as needed
import Search from './app/assets/Search.svg'; // Adjust the path as needed
import Logo from './app/assets/Logo.svg'; // Adjust the path as needed
import Heart from './app/assets/Heart.svg'; // Adjust the path as needed
import Settings from './app/assets/Settings.svg'; // Adjust the path as needed

// Extend global namespace for cart storage
declare global {
  interface CartItem {
    id: number;
    name: string;
    price: string;
    image: any;
    size: string;
    quantity: number;
    isLiked?: boolean;
  }
  
  var cartStorage: cartStorage.CartStorage;
}

// Define types for improved navigation
type ScreenName = 'Home' | 'Cart' | 'Search' | 'Favorites' | 'Settings';
type NavigationListener = () => void;

interface SimpleNavigation {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  addListener: (event: string, callback: NavigationListener) => () => void;
  setParams?: (params: any) => void;
}

interface NavButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  isActive?: boolean;
}

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const loadFonts = async () => {
  await Font.loadAsync({
    'IgraSans': require('./app/assets/fonts/IgraSans.otf'), // Adjust the path as needed
    'REM': require('./app/assets/fonts/REM-Regular.ttf'), // Adjust the path as needed
  });
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null means "checking"
  const [showLoading, setShowLoading] = useState(true);
  const [showAuthLoading, setShowAuthLoading] = useState(false);
  
  // Profile completion states
  const [profileCompletionStatus, setProfileCompletionStatus] = useState<api.ProfileCompletionStatus | null>(null);
  const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);
  const [showBrandSearchScreen, setShowBrandSearchScreen] = useState(false);
  const [showStylesSelectionScreen, setShowStylesSelectionScreen] = useState(false);
  const [stylePreference, setStylePreference] = useState<'option1' | 'option2' | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  const [previousScreen, setPreviousScreen] = useState<ScreenName | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cartInitialized, setCartInitialized] = useState(false);
  const [comingFromSignup, setComingFromSignup] = useState(false); // Track if user is coming from signup
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Navigation event listeners
  const navigationListeners = useRef<Record<string, Set<NavigationListener>>>({
    beforeRemove: new Set(),
  }).current;

  // Keep track of screen params
  const [screenParams, setScreenParams] = useState<Record<ScreenName, any>>({
    Home: {},
    Cart: {},
    Search: {},
    Favorites: {},
    Settings: {}
  });

  // Initialize cart from storage
  useEffect(() => {
    const initCart = async () => {
      try {
        // Initialize cart from persistent storage
        const savedItems = await cartStorage.initializeCart();
        
        // Create cart storage with saved items
        global.cartStorage = cartStorage.createCartStorage(savedItems);
        
        setCartInitialized(true);
        console.log('App - Cart initialized from storage with items:', savedItems.length);
      } catch (error) {
        console.error('Error initializing cart:', error);
        // Fallback to empty cart
        global.cartStorage = cartStorage.createCartStorage([]);
        setCartInitialized(true);
      }
    };

    initCart();
  }, []);

  // Check if user is logged in and profile completion status on app start
  useEffect(() => {
    const checkAuthAndProfileStatus = async () => {
      try {
        console.log('Checking authentication and profile status...');
        
        // First, initialize the simulated user if we're in development mode
        await api.initSimulatedUser();
        
        // Check if session is valid
        const session = await api.getSession();
        
        if (!session.isValid) {
          // Session invalid or expired, show welcome screen
          console.log('Session invalid or expired, showing welcome screen');
          setIsLoggedIn(false);
          setShowAuthLoading(true);
          return;
        }
        
        console.log('Session valid, checking profile completion status');
        
        // Session valid, get profile completion status
        try {
          const completionStatus = await api.simulateGetProfileCompletionStatus();
          setProfileCompletionStatus(completionStatus);
          
          console.log('Profile completion status:', JSON.stringify(completionStatus));
          
          if (!completionStatus.isComplete) {
            // Profile is incomplete, determine which screen to show
            console.log('Profile incomplete, required screens:', completionStatus.requiredScreens);
            
            if (completionStatus.requiredScreens.includes('confirmation')) {
              setShowConfirmationScreen(true);
            } else if (completionStatus.requiredScreens.includes('brands')) {
              setStylePreference(await getUserStylePreference());
              setShowBrandSearchScreen(true);
            } else if (completionStatus.requiredScreens.includes('styles')) {
              setStylePreference(await getUserStylePreference());
              setSelectedBrands(await getUserSelectedBrands());
              setShowStylesSelectionScreen(true);
            }
          }
          
          // User is logged in regardless of profile completion
          setIsLoggedIn(true);
          
          // Show loading screen for returning users with complete profiles
          if (completionStatus.isComplete) {
            console.log('Profile complete, showing loading screen for returning user');
            setComingFromSignup(false);
            setShowLoading(true);
          } else {
            // For users with incomplete profiles, skip loading
            console.log('Profile incomplete, skipping loading screen');
            setComingFromSignup(true);
          }
        } catch (error) {
          console.error('Error checking profile completion:', error);
          // If error fetching profile status, assume logged in but show loading
          setIsLoggedIn(true);
          setShowLoading(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
        setShowAuthLoading(true);
      }
    };

    checkAuthAndProfileStatus();
  }, []);
  
  // Helper function to get user style preference
  const getUserStylePreference = async (): Promise<'option1' | 'option2'> => {
    try {
      const user = await api.simulateGetCurrentUser();
      return user.stylePreference || 'option1';
    } catch (error) {
      console.error('Error getting user style preference:', error);
      return 'option1'; // Default to option1 if error
    }
  };
  
  // Helper function to get user selected brands
  const getUserSelectedBrands = async (): Promise<string[]> => {
    try {
      const user = await api.simulateGetCurrentUser();
      return user.selectedBrands || [];
    } catch (error) {
      console.error('Error getting user selected brands:', error);
      return []; // Default to empty array if error
    }
  };

  useEffect(() => {
    const loadResources = async () => {
      try {
        await loadFonts();
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
        // Hide the splash screen after loading resources
        await SplashScreen.hideAsync();
      }
    };

    loadResources();
  }, []);

  const handleLoadingFinish = () => {
    setShowLoading(false);
    
    // Ensure we start on the Home screen after login
    setCurrentScreen('Home');
  };

  const handleAuthLoadingFinish = () => {
    // Hide the auth loading screen
    setShowAuthLoading(false);
    console.log('Auth loading screen finished, hiding it');
    
    // If the user just logged in, make sure we're on the Home screen
    if (isLoggedIn) {
      setCurrentScreen('Home');
    }
  };

  const handleLogin = async () => {
    console.log('Login initiated');
    
    // Reset to Home screen when logging back in
    setCurrentScreen('Home');
    
    // Check profile completion status after login
    try {
      const completionStatus = await api.simulateGetProfileCompletionStatus();
      setProfileCompletionStatus(completionStatus);
      
      // Update logged in state
      setIsLoggedIn(true);
      
      if (!completionStatus.isComplete) {
        // Profile is incomplete, determine which screen to show
        console.log('Login: Profile incomplete, required screens:', completionStatus.requiredScreens);
        setComingFromSignup(true);
        
        if (completionStatus.requiredScreens.includes('confirmation')) {
          setShowConfirmationScreen(true);
          return;
        } else if (completionStatus.requiredScreens.includes('brands')) {
          setStylePreference(await getUserStylePreference());
          setShowBrandSearchScreen(true);
          return;
        } else if (completionStatus.requiredScreens.includes('styles')) {
          setStylePreference(await getUserStylePreference());
          setSelectedBrands(await getUserSelectedBrands());
          setShowStylesSelectionScreen(true);
          return;
        }
      }
      
      // If profile is complete, show loading screen for normal login flow
      console.log('Login: Profile complete, showing loading screen');
      setComingFromSignup(false);
      setShowLoading(true);
    } catch (error) {
      console.error('Error checking profile completion after login:', error);
      // If error, proceed with normal login flow
      setIsLoggedIn(true);
      setComingFromSignup(false);
      setShowLoading(true);
    }
  };

  const handleRegister = async (
    stylePreference?: 'option1' | 'option2', 
    selectedBrands?: string[],
    favoriteStyles?: string[]
  ) => {
    console.log('Registration completed with:');
    console.log('- Style preference:', stylePreference || 'default');
    console.log('- Selected brands:', selectedBrands?.length ? selectedBrands.join(', ') : 'none');
    console.log('- Favorite styles:', favoriteStyles?.length ? favoriteStyles.join(', ') : 'none');
    
    // Ensure we're working with valid arrays even if undefined was passed
    const brands = selectedBrands || [];
    const styles = favoriteStyles || [];
    
    // Save user preferences to API
    try {
      if (stylePreference) {
        await api.simulateUpdateStylePreference(stylePreference);
      }
      
      if (brands.length > 0) {
        await api.simulateUpdateSelectedBrands(brands);
      }
      
      if (styles.length > 0) {
        await api.simulateUpdateFavoriteStyles(styles);
      }
      
      // Check if profile is now complete
      const completionStatus = await api.simulateGetProfileCompletionStatus();
      console.log('Register: Profile completion status after updates:', JSON.stringify(completionStatus));
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
    
    // Store the user preferences in screenParams for the main page
    setScreenParams(prev => ({
      ...prev,
      Home: {
        ...prev.Home,
        stylePreference,
        selectedBrands: brands,
        favoriteStyles: styles
      }
    }));
    
    // For new users coming from signup, skip the loading screen
    setComingFromSignup(true);
    setIsLoggedIn(true);
    console.log('Skipping loading screen for new user');
  };

  const handleLogout = async () => {
    try {
      // Remember that we want to return to Home screen after next login
      // This is a more comprehensive approach than just setting in handleLogin
      await AsyncStorage.setItem('@PolkaMobile:lastScreen', 'Home');
      
      // Clear cart data when logging out
      await cartStorage.clearCart();
      
      // Reset cart to empty
      global.cartStorage = cartStorage.createCartStorage([]);
      
      // Log out from API
      await api.simulateLogoutUser();
      
      // First show the auth loading screen before setting isLoggedIn to false
      // This ensures a smooth transition between states
      setShowAuthLoading(true);
      
      // Reset profile completion state
      setProfileCompletionStatus(null);
      setShowConfirmationScreen(false);
      setShowBrandSearchScreen(false);
      setShowStylesSelectionScreen(false);
      
      // Small delay to ensure auth loading screen is visible before changing logged in state
      setTimeout(() => {
        setIsLoggedIn(false);
        console.log('App - User logged out, cart cleared');
      }, 50);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Handle confirmation screen completion
  const handleConfirmationComplete = async (choice: 'option1' | 'option2') => {
    console.log(`User selected style preference: ${choice}`);
    
    // Save the style preference
    setStylePreference(choice);
    
    try {
      // Update the style preference in the API
      await api.simulateUpdateStylePreference(choice);
      
      // Check if brands selection is needed
      const completionStatus = await api.simulateGetProfileCompletionStatus();
      
      if (completionStatus.requiredScreens.includes('brands')) {
        setShowConfirmationScreen(false);
        setShowBrandSearchScreen(true);
      } else if (completionStatus.requiredScreens.includes('styles')) {
        setShowConfirmationScreen(false);
        setShowStylesSelectionScreen(true);
      } else {
        // Profile is complete, go to main app
        setShowConfirmationScreen(false);
        // For users completing their profile, skip the loading screen
        setComingFromSignup(true);
      }
    } catch (error) {
      console.error('Error updating style preference:', error);
      // In case of error, proceed to brands selection
      setShowConfirmationScreen(false);
      setShowBrandSearchScreen(true);
    }
  };
  
  // Handle brand search completion
  const handleBrandSearchComplete = async (brands: string[]) => {
    console.log(`User selected brands: ${brands.join(', ')}`);
    
    // Save the selected brands
    setSelectedBrands(brands);
    
    try {
      // Update the selected brands in the API
      await api.simulateUpdateSelectedBrands(brands);
      
      // Check if styles selection is needed
      const completionStatus = await api.simulateGetProfileCompletionStatus();
      
      if (completionStatus.requiredScreens.includes('styles')) {
        setShowBrandSearchScreen(false);
        setShowStylesSelectionScreen(true);
      } else {
        // Profile is complete, go to main app
        setShowBrandSearchScreen(false);
        // For users completing their profile, skip the loading screen
        setComingFromSignup(true);
      }
    } catch (error) {
      console.error('Error updating selected brands:', error);
      // In case of error, proceed to styles selection
      setShowBrandSearchScreen(false);
      setShowStylesSelectionScreen(true);
    }
  };
  
  // Handle styles selection completion
  const handleStylesSelectionComplete = async (styles: string[]) => {
    console.log(`User selected styles: ${styles.join(', ')}`);
    
    try {
      // Update the favorite styles in the API
      await api.simulateUpdateFavoriteStyles(styles);
      
      // Store styles in screenParams for the main page
      setScreenParams(prev => ({
        ...prev,
        Home: {
          ...prev.Home,
          stylePreference,
          selectedBrands,
          favoriteStyles: styles
        }
      }));
      
      // Complete profile flow
      setShowStylesSelectionScreen(false);
      // For users completing their profile, skip the loading screen
      setComingFromSignup(true);
    } catch (error) {
      console.error('Error updating favorite styles:', error);
      // Even in case of error, complete the profile flow
      setShowStylesSelectionScreen(false);
      setComingFromSignup(true);
    }
  };

  // Notify listeners before screen change
  const notifyBeforeRemove = () => {
    navigationListeners.beforeRemove.forEach(listener => listener());
  };

  // Improved screen transition with proper lifecycle
  const handleNavPress = (screen: ScreenName, params?: any) => {
    // Special case: If pressing Home while already on Home, refresh cards instead of navigating
    if (screen === 'Home' && currentScreen === 'Home') {
      // Update params with a refreshCards signal and timestamp to ensure it's unique each time
      setScreenParams(prev => ({
        ...prev,
        Home: {
          ...prev.Home,
          refreshCards: true,
          refreshTimestamp: Date.now()
        }
      }));
      // Skip the screen transition animation
      return;
    }
    
    if (screen === currentScreen && !params) return;
    
    setIsTransitioning(true);
    setPreviousScreen(currentScreen);
    
    // Update params for the target screen if provided
    if (params) {
      setScreenParams(prev => ({
        ...prev,
        [screen]: params
      }));
    }
    
    // Notify current screen it's about to be removed
    notifyBeforeRemove();
    
    // Fade out current screen
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150, // Faster fade out
      useNativeDriver: true
    }).start(() => {
      // Change screen
      setCurrentScreen(screen);
      
      // Reset slide position for entrance animation
      slideAnim.setValue(30); // Reduced from 50 for subtler animation
      
      // Slide and fade in new screen
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        })
      ]).start(() => {
        setIsTransitioning(false);
      });
    });
  };

  // Enhanced navigation object with proper listeners and params support
  const navigation: SimpleNavigation = {
    navigate: (screen: string, params?: any) => handleNavPress(screen as ScreenName, params),
    goBack: () => handleNavPress('Home'),
    addListener: (event: string, callback: NavigationListener) => {
      if (!navigationListeners[event]) {
        navigationListeners[event] = new Set();
      }
      navigationListeners[event].add(callback);
      
      // Return unsubscribe function
      return () => {
        navigationListeners[event].delete(callback);
      };
    },
    setParams: (params: any) => {
      // Update params for the current screen
      setScreenParams(prev => ({
        ...prev,
        [currentScreen]: {
          ...prev[currentScreen],
          ...params
        }
      }));
    }
  };

  const NavButton = ({ onPress, children, isActive }: NavButtonProps) => {
    // Animation values for press effect and shadow
    const [scale] = useState(new Animated.Value(1));
    const [shadowOpacity] = useState(new Animated.Value(isActive ? 0.5 : 0));
    
    // Update shadow opacity when active state changes
    useEffect(() => {
      Animated.timing(shadowOpacity, {
        toValue: isActive ? 0.5 : 0,
        duration: 150,
        useNativeDriver: false, // Shadow opacity can't use native driver
        easing: Easing.inOut(Easing.ease)
      }).start();
    }, [isActive, shadowOpacity]);
    
    const handlePressIn = () => {
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease)
      }).start();
    };
    
    const handlePressOut = () => {
      Animated.timing(scale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease)
      }).start();
      
      // Call the actual onPress handler
      onPress();
    };
    
    // Create animated shadow style that will change with shadowOpacity value
    const animatedShadowStyle = {
      shadowColor: 'rgba(0, 0, 0, 1)',
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 4,
      shadowOpacity: shadowOpacity,
      elevation: shadowOpacity.interpolate({
        inputRange: [0, 0.5],
        outputRange: [0, 3]
      }),
      backgroundColor: 'transparent',
      borderRadius: 18
    };
    
    return (
      <Pressable 
        style={[styles.navItem, isActive ? styles.activeNavItem : null]} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isTransitioning} // Prevent navigation during transitions
      >
        <Animated.View style={[
          { transform: [{ scale }] },
          animatedShadowStyle
        ]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  };

  // Main render function
  if (!fontsLoaded) {
    return null; // Don't render until fonts are loaded
  }

  // If isLoggedIn is null, we're still checking auth status - show the SimpleAuthLoadingScreen
  if (isLoggedIn === null) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SimpleAuthLoadingScreen />
      </GestureHandlerRootView>
    );
  }

  // If not logged in, show the welcome screen
  if (!isLoggedIn) {
    return (
      <GestureHandlerRootView style={{flex: 1}}>
        {/* Always render WelcomeScreen as the base layer */}
        <WelcomeScreen onLogin={handleLogin} onRegister={handleRegister} />
        
        {/* Overlay the AuthLoadingScreen on top while it's active */}
        {showAuthLoading && (
          <AuthLoadingScreen onFinish={handleAuthLoadingFinish} />
        )}
      </GestureHandlerRootView>
    );
  }
  
  // If logged in but profile is incomplete, show the appropriate completion screen
  if (showConfirmationScreen) {
    return (
      <GestureHandlerRootView style={{flex: 1}}>
        <ConfirmationScreen 
          onComplete={handleConfirmationComplete} 
          onBack={() => {
            // Go back to welcome screen (logout)
            setIsLoggedIn(false);
            setShowConfirmationScreen(false);
          }}
        />
        <AuthLoadingScreen onFinish={handleAuthLoadingFinish} />
      </GestureHandlerRootView>
    );
  }
  
  if (showBrandSearchScreen) {
    return (
      <GestureHandlerRootView style={{flex: 1}}>
        <BrandSearchScreen 
          onComplete={handleBrandSearchComplete}
          onBack={() => {
            // Go back to confirmation screen
            setShowBrandSearchScreen(false);
            setShowConfirmationScreen(true);
          }}
        />
        <AuthLoadingScreen onFinish={handleAuthLoadingFinish} />
      </GestureHandlerRootView>
    );
  }
  
  if (showStylesSelectionScreen) {
    return (
      <GestureHandlerRootView style={{flex: 1}}>
        <StylesSelectionScreen 
          onComplete={handleStylesSelectionComplete}
          onBack={() => {
            // Go back to brand search screen
            setShowStylesSelectionScreen(false);
            setShowBrandSearchScreen(true);
          }}
        />
        <AuthLoadingScreen onFinish={handleAuthLoadingFinish} />
      </GestureHandlerRootView>
    );
  }

  // User is logged in with complete profile, show the main app
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <LinearGradient
        colors={[
          '#FAE9CF',
          '#CCA479',
          '#CDA67A',
          '#6A462F'
        ]}
        locations={[0, 0.34, 0.50, 0.87]}
        style={styles.gradient}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
      >
        <SafeAreaView style={styles.container}>
          {/* Always render the main app with appropriate animation */}
          <Animated.View 
            style={[
              styles.screenContainer,
              comingFromSignup 
                ? {opacity: 1, transform: [{translateY: 0}]} // No animation when coming from signup
                : {opacity: fadeAnim, transform: [{translateY: slideAnim}]} // Normal animation otherwise
            ]}
          >
            {currentScreen === 'Home' && <MainPage navigation={navigation} route={{ params: screenParams.Home }} />}
            {currentScreen === 'Cart' && <CartPage navigation={navigation} />}
            {currentScreen === 'Search' && <SearchPage navigation={navigation} />}
            {currentScreen === 'Favorites' && <FavoritesPage navigation={navigation} />}
            {currentScreen === 'Settings' && (
              <SettingsPage 
                navigation={navigation} 
                onLogout={handleLogout} // Pass logout handler to Settings
              />
            )}
          </Animated.View>

          <View style={styles.navbar}>
            <NavButton 
              onPress={() => handleNavPress('Cart')} 
              isActive={currentScreen === 'Cart'}
            >
              <Cart width={32.75} height={32} />
            </NavButton>

            <NavButton 
              onPress={() => handleNavPress('Search')} 
              isActive={currentScreen === 'Search'}
            >
              <Search width={24.75} height={24.75} />
            </NavButton>

            <NavButton 
              onPress={() => handleNavPress('Home')} 
              isActive={currentScreen === 'Home'}
            >
              <Logo width={21} height={28}/>
            </NavButton>

            <NavButton 
              onPress={() => handleNavPress('Favorites')} 
              isActive={currentScreen === 'Favorites'}
            >
              <Heart width={28.74} height={25.07} />
            </NavButton>

            <NavButton 
              onPress={() => handleNavPress('Settings')} 
              isActive={currentScreen === 'Settings'}
            >
              <Settings width={30.25} height={30.25} />
            </NavButton>
          </View>
          
          {/* Conditionally render the loading screen on top only for returning users */}
          {showLoading && !comingFromSignup && (
            <LoadingScreen onFinish={handleLoadingFinish} />
          )}
        </SafeAreaView>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: 'transparent',
  },
  gradient: {
    flex: 1,
  },
  screenContainer: {
    height: Platform.OS === 'android' ? '88%' : '92%',
    width: '100%',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(205, 166, 122, 0.2)', // #CDA67A with 20% opacity
    height: '12%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 15,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  activeNavItem: {
    // Slight visual indicator for active nav item
    opacity: 1,
    //transform: [{scale: 1.05}] // Reduced from 1.1 for subtlety
  },
  icon: {
    width: 20,
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3E6D6',
  },
});