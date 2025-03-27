import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import Logo from './assets/Logo.svg';

interface LoadingScreenProps {
  onFinish: () => void;
}

const { width, height } = Dimensions.get('window');
const LOGO_SIZE_LARGE = Math.min(width, height) * 0.3; // 30% of the smallest dimension
const LOGO_SIZE_SMALL = LOGO_SIZE_LARGE*0.86; // Size in the navbar

const AuthLoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const positionY = useRef(new Animated.Value(0)).current;
  const bgFadeAnim = useRef(new Animated.Value(1)).current;
  const hasFinished = useRef(false);

  // Function to safely complete the loading animation
  const safelyFinish = () => {
    if (!hasFinished.current) {
      hasFinished.current = true;
      onFinish();
    }
  };

  useEffect(() => {
    // Wait for 500ms with the logo showing
    const initialDelay = Animated.delay(500);
    
    // First jump up - use a specific easing function to prevent bounce
    const jumpUp = Animated.timing(positionY, {
      toValue: height * 0.05, // Jump up by 15% of screen height
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic), // Smoother deceleration
    });
    
    // Calculate the position to move the logo all the way to the navbar
    const navbarPosition = -height*0.4;
    
    // Keep the background visible but fade the logo
    const fadeOutLogo = Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.linear, // Linear fade for consistency
    });
    
    // Important: Fade out the background completely for a smooth transition
    // Fade out background slightly slower to ensure smooth transition
    const fadeOutBg = Animated.timing(bgFadeAnim, {
      toValue: 0, // Completely fade out
      duration: 600, // Slightly longer duration to ensure WelcomeScreen is visible
      useNativeDriver: true,
      easing: Easing.linear,
    });
    
    const shrink = Animated.timing(scaleAnim, {
      toValue: LOGO_SIZE_SMALL / LOGO_SIZE_LARGE,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.linear, // Linear scaling for consistency
    });
    
    const moveUp = Animated.timing(positionY, {
      toValue: navbarPosition,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.in(Easing.cubic), // Smooth acceleration, no bounce
    });

    // Run the animations in sequence with careful timing
    Animated.sequence([
      initialDelay,
      jumpUp,
      Animated.parallel([fadeOutLogo, shrink, moveUp, fadeOutBg])
    ]).start(() => {
      // Wait for the animation to complete before calling onFinish
      // This is important so the Welcome screen is fully visible
      safelyFinish();
    });
    
    // Safety timeout in case animation fails to complete
    const safetyTimeout = setTimeout(() => {
      safelyFinish();
    }, 2500); // 2.5 second timeout
    
    // Clean up on unmount
    return () => clearTimeout(safetyTimeout);
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: bgFadeAnim,
          // Make sure background color has alpha for smooth transitions
          backgroundColor: 'rgba(243, 230, 214, 1)' 
        }
      ]}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: positionY }
            ]
          }
        ]}
      >
        <Logo width={LOGO_SIZE_LARGE} height={LOGO_SIZE_LARGE} />
      </Animated.View>
      
      <Animated.Text 
        style={[
          styles.poweredByText,
          { opacity: fadeAnim }
        ]}
      >
        Powered by AI
      </Animated.Text>
      
      <Animated.Text style={[styles.poweredByText, { opacity: fadeAnim, position: 'absolute', bottom: height*0.05 }]}>
        ПОЛКА
      </Animated.Text>
    </Animated.View>
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
});

export default AuthLoadingScreen;  