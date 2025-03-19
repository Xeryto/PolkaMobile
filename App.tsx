import React, { useState, useEffect, useRef } from 'react';
import * as Font from 'expo-font';
//import { StatusBar } from 'expo-status-bar';
import { Platform, StatusBar, Pressable, SafeAreaView, StyleSheet, Text, View, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MainPage from './app/MainPage';
import CartPage from './app/Cart';
import SearchPage from './app/Search';
import FavoritesPage from './app/Favorites';
import SettingsPage from './app/Settings';
import LoadingScreen from './app/LoadingScreen';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Cart from './app/assets/Cart.svg'; // Adjust the path as needed
import Search from './app/assets/Search.svg'; // Adjust the path as needed
import Logo from './app/assets/Logo.svg'; // Adjust the path as needed
import Heart from './app/assets/Heart.svg'; // Adjust the path as needed
import Settings from './app/assets/Settings.svg'; // Adjust the path as needed

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
  const [showLoading, setShowLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  const [previousScreen, setPreviousScreen] = useState<ScreenName | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(1)).current; // Animation for the glow effect
  
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

  // Start the glow animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1.05, // Very subtle scale increase
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ])
    ).start();
  }, []);

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
  };

  // Notify listeners before screen change
  const notifyBeforeRemove = () => {
    navigationListeners.beforeRemove.forEach(listener => listener());
  };

  // Improved screen transition with proper lifecycle
  const handleNavPress = (screen: ScreenName, params?: any) => {
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

  const NavButton = ({ onPress, children, isActive }: NavButtonProps) => (
    <Pressable 
      style={[styles.navItem, isActive ? styles.activeNavItem : null]} 
      onPress={onPress}
      disabled={isTransitioning} // Prevent navigation during transitions
    >
      {isActive ? (
        <Animated.View 
          style={[
            styles.activeIconContainer,
            { transform: [{ scale: glowAnim }] }
          ]}
        >
          {children}
        </Animated.View>
      ) : (
        children
      )}
    </Pressable>
  );

  if (!fontsLoaded) {
    return null; // Return null while fonts are loading
  }

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
          {/* Always render the main app */}
          <Animated.View 
            style={[
              styles.screenContainer,
              {opacity: fadeAnim, transform: [{translateY: slideAnim}]}
            ]}
          >
            {currentScreen === 'Home' && <MainPage navigation={navigation} route={{ params: screenParams.Home }} />}
            {currentScreen === 'Cart' && <CartPage navigation={navigation} />}
            {currentScreen === 'Search' && <SearchPage navigation={navigation} />}
            {currentScreen === 'Favorites' && <FavoritesPage navigation={navigation} />}
            {currentScreen === 'Settings' && <SettingsPage navigation={navigation} />}
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
          
          {/* Conditionally render the loading screen on top */}
          {showLoading && (
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
    //height: 48,
    //width: 48,
  },
  activeNavItem: {
    // Slight visual indicator for active nav item
    opacity: 1,
    //transform: [{scale: 1.05}] // Reduced from 1.1 for subtlety
  },
  activeIconContainer: {
    // Subtle dark shadow for active icon
    shadowColor: 'rgba(0, 0, 0, 1)', // Semi-transparent black
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5, // Reduced for subtlety
    shadowRadius: 4, // Tighter shadow
    elevation: 3, // Lower elevation
    backgroundColor: 'transparent',
    borderRadius: 18,
    padding: 0, // Remove padding to improve quality
  },
  icon: {
    width: 20,
    height: 20,
  },
});