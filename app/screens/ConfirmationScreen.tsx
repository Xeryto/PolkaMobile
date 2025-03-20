import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import Logo from '../assets/Logo.svg';

const { width, height } = Dimensions.get('window');

interface ConfirmationScreenProps {
  onComplete: (choice: 'option1' | 'option2') => void;
}

const LOGO_SIZE = Math.min(width, height) * 0.3; // 25% of the smallest dimension

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<'option1' | 'option2' | null>(null);
  const animationProgress = useSharedValue(0);
  
  useEffect(() => {
    if (selectedOption) {
      // Start the transition animation
      animationProgress.value = withTiming(1, {
        duration: 800,
        easing: Easing.inOut(Easing.cubic)
      });
      
      // Transition to main page after animation
      const timer = setTimeout(() => {
        onComplete(selectedOption);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedOption, onComplete]);
  
  // Separate transform animation from opacity
  const transformAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateY: withTiming(animationProgress.value * 50, { 
            duration: 500,
            easing: Easing.inOut(Easing.cubic)
          }) 
        }
      ]
    };
  });

  // Separate opacity animation
  const opacityAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(1 - animationProgress.value, { duration: 500 }),
    };
  });
  
  return (
    <LinearGradient
      colors={[
        '#FAE9CF',
        '#CCA479',
        '#CDA67A',
        '#6A462F'
      ]}
      locations={[0, 0.34, 0.50, 0.87]}
      style={styles.container}
      start={{ x: 0, y: 0.2 }}
      end={{ x: 1, y: 0.8 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.formContainerShadow}>
          {/* Separate nested Animated.Views for different animation properties */}
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={[styles.formContainer]}
          >
            <Animated.View style={[opacityAnimatedStyle, transformAnimatedStyle, { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'space-around', flexDirection: 'row' }]}>
              <View style={styles.logoContainer}>
                <Logo width={LOGO_SIZE} height={LOGO_SIZE} />
              </View>
              
              <View style={styles.buttonShadow}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedOption === 'option1' && styles.selectedButtonM,
                    {backgroundColor: '#E0D6CC'}
                  ]}
                  onPress={() => setSelectedOption('option1')}
                >
                  <Text style={[
                    styles.optionButtonTextM,
                    selectedOption === 'option1' && styles.selectedButtonTextM
                  ]}>
                    М
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.buttonShadow}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedOption === 'option2' && styles.selectedButtonF,
                    {backgroundColor: '#9A7859'}
                  ]}
                  onPress={() => setSelectedOption('option2')}
                >
                  <Text style={[
                    styles.optionButtonTextF,
                    selectedOption === 'option2' && styles.selectedButtonTextF
                  ]}>
                    Ж
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainerShadow: {
    width: '90%',
    height: '90%',
    borderRadius: 41,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  formContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2ECE7',
    borderRadius: 41,
    ...Platform.select({
      android: {
        overflow: 'hidden',
      },
    }),
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    position: 'absolute',
    top: height * 0.03,
    left: width / 2 - LOGO_SIZE / 2,
    right: width / 2 - LOGO_SIZE / 2,
  },
  buttonShadow: {
    borderRadius: 41,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  optionButton: {
    width: 99,
    height: 99,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: {
        overflow: 'hidden',
      },
    }),
  },
  selectedButtonM: {
    backgroundColor: '#4A3120',
  },
  selectedButtonF: {
    backgroundColor: '#9A7859',
  },
  optionButtonTextM: {
    fontFamily: 'IgraSans',
    fontSize: 40,
    color: '#9A7859',
  },
  optionButtonTextF: {
    fontFamily: 'IgraSans',
    fontSize: 40,
    color: '#E0D6CC',
  },
  selectedButtonTextM: {
    color: '#9A7859',
  },
  selectedButtonTextF: {
    color: '#E0D6CC',
  },
});

export default ConfirmationScreen; 