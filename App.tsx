import React, { useState, useEffect } from 'react';
import * as Font from 'expo-font';
//import { StatusBar } from 'expo-status-bar';
import { Platform, StatusBar, Pressable, SafeAreaView, StyleSheet, Text, View, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MainPage from './app/MainPage';
import Cart from './app/Cart';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
            {currentScreen === 'Cart' && <Cart />}
          </View>
  
          <View style={styles.navbar}>
            <NavButton onPress={() => handleNavPress('Cart')}>
              <Image 
                source={require('./app/assets/Cart.png')}
                style={styles.icon}
              />
            </NavButton>

            <NavButton onPress={() => handleNavPress('Search')}>
              <Image 
                source={require('./app/assets/Search.png')}
                style={styles.icon}
              />
            </NavButton>

            <NavButton onPress={() => handleNavPress('Home')}>
              <Image 
                source={require('./app/assets/Logo.png')}
                style={styles.icon}
              />
            </NavButton>

            <NavButton onPress={() => handleNavPress('Favorites')}>
              <Image 
                source={require('./app/assets/Heart.png')}
                style={styles.icon}
              />
            </NavButton>

            <NavButton onPress={() => handleNavPress('Settings')}>
              <Image 
                source={require('./app/assets/Settings.png')}
                style={styles.icon}
              />
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
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    //height: 48,
    //width: 48,
  },
  icon: {
    flex: 0.3,
    //width: 28,
    //height: 28,
    resizeMode: 'contain', // Ensure the image scales properly
  },
});