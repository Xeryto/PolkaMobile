import React, { useState, useEffect } from 'react';
import * as Font from 'expo-font';
//import { StatusBar } from 'expo-status-bar';
import { Platform, StatusBar, Pressable, SafeAreaView, StyleSheet, Text, View, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MainPage from './app/MainPage';
import CartPage from './app/Cart';
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
    setCurrentScreen(screen);
  };

  const NavButton = ({ onPress, children }: NavButtonProps) => (
    <Pressable 
      style={styles.navItem} 
      onPress={onPress}
    >
      {children}
    </Pressable>
  );

  return (
    <GestureHandlerRootView>
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
          <View style={{height: Platform.OS == 'android' ? '88%' : '92%'}}>
            {currentScreen === 'Home' && <MainPage />}
            {currentScreen === 'Cart' && <CartPage />}
          </View>
  
          <View style={styles.navbar}>
            <NavButton onPress={() => handleNavPress('Cart')}>
              <Cart width={32.75} height={32} />
            </NavButton>

            <NavButton onPress={() => handleNavPress('Search')}>
              <Search width={24.75} height={24.75} />
            </NavButton>

            <NavButton onPress={() => handleNavPress('Home')}>
              <Logo width={21} height={28}/>
            </NavButton>

            <NavButton onPress={() => handleNavPress('Favorites')}>
              <Heart width={28.74} height={25.07} />
            </NavButton>

            <NavButton onPress={() => handleNavPress('Settings')}>
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
  icon: {
    width: 20,
    height: 20,
  },
});