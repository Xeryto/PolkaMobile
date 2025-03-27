import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Logo from './assets/Logo.svg';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width, height) * 0.3; // 30% of the smallest dimension

interface SimpleAuthLoadingScreenProps {
  // No onFinish prop needed since this screen is purely for display during status checks
}

const SimpleAuthLoadingScreen: React.FC<SimpleAuthLoadingScreenProps> = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo width={LOGO_SIZE} height={LOGO_SIZE} />
      </View>
      
      <Text style={styles.poweredByText}>
        Powered by AI
      </Text>


      <Text style={[styles.poweredByText, { position: 'absolute', bottom: height*0.05 }]}>
        ПОЛКА
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3E6D6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    position: 'absolute',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  poweredByText: {
    fontFamily: 'IgraSans',
    fontSize: 13,
    color: '#4A3120',
    marginTop: 20,
  },
  loadingText: {
    fontFamily: 'REM',
    fontSize: 16,
    color: '#4A3120',
    marginTop: 30,
  }
});

export default SimpleAuthLoadingScreen; 