import React, { useState, useEffect } from 'react';
import * as Font from 'expo-font';
//import { StatusBar } from 'expo-status-bar';
import { Platform, StatusBar, Pressable, SafeAreaView, StyleSheet, Text, View, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MainPage from './app/MainPage';
import CartPage from './app/Cart';
import SearchPage from './app/Search';
import FavoritesPage from './app/Favorites';
import SettingsPage from './app/Settings';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Cart from './app/assets/Cart.svg'; // Adjust the path as needed
import Search from './app/assets/Search.svg'; // Adjust the path as needed
import Logo from './app/assets/Logo.svg'; // Adjust the path as needed
import Heart from './app/assets/Heart.svg'; // Adjust the path as needed
import Settings from './app/assets/Settings.svg'; // Adjust the path as needed

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
  const [currentScreen, setCurrentScreen] = useState('Home');
  const fadeAnim = useState(new Animated.Value(1))[0];
  const slideAnim = useState(new Animated.Value(0))[0];
  const glowAnim = useState(new Animated.Value(1))[0]; // Animation for the glow effect

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

  if (!fontsLoaded) {
    return null; // Return null while fonts are loading
  }

  const handleNavPress = (screen: string) => {
    if (screen === currentScreen) return;
    
    // Fade out current screen
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => {
      // Change screen
      setCurrentScreen(screen);
      
      // Reset slide position
      slideAnim.setValue(50);
      
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
          useNativeDriver: true
        })
      ]).start();
    });
  };

  // Create simple navigation object
  const navigation = {
    navigate: (screen: string) => handleNavPress(screen),
    goBack: () => handleNavPress('Home')
  };

  const NavButton = ({ onPress, children, isActive }: NavButtonProps) => (
    <Pressable 
      style={[styles.navItem, isActive ? styles.activeNavItem : null]} 
      onPress={onPress}
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
          <Animated.View 
            style={[
              {height: Platform.OS == 'android' ? '88%' : '92%'}, 
              {opacity: fadeAnim, transform: [{translateY: slideAnim}]}
            ]}
          >
            {currentScreen === 'Home' && <MainPage navigation={navigation} />}
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