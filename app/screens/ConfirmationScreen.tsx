import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  SafeAreaView,
  Dimensions,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeInDown,
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  FadeOutDown,
  FadeOut
} from 'react-native-reanimated';
import Logo from '../assets/Logo.svg';
import BackIcon from '../assets/Back.svg';

const { width, height } = Dimensions.get('window');

interface ConfirmationScreenProps {
  onComplete: (choice: 'option1' | 'option2') => void;
  onBack?: () => void; // Optional back handler
}

const LOGO_SIZE = Math.min(width, height) * 0.275; // 25% of the smallest dimension

const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ onComplete, onBack }) => {
  const [selectedOption, setSelectedOption] = useState<'option1' | 'option2' | null>(null);
  
  // Handle option selection with fade-out animation
  const handleOptionSelect = (option: 'option1' | 'option2') => {
    setSelectedOption(option);
    
    // Delay onComplete call to allow animation to complete
    onComplete(option);
  };
  
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
        <Animated.View 
          style={styles.roundedBox} 
          entering={FadeInDown.duration(500)} 
        >
          <LinearGradient
            colors={["rgba(205, 166, 122, 0.5)", "transparent"]}
            start={{ x: 0.1, y: 1 }}
            end={{ x: 0.9, y: 0.3 }}
            style={styles.gradientBackground}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
              <BackIcon width={33} height={33} />
          </TouchableOpacity>  
          <Animated.View 
            style={styles.formContainerShadow} 
          >
            {/* Separate nested Animated.Views for different animation properties */}
            <View 
              style={[styles.formContainer]}
            >
              <Animated.View style={[{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'space-around', flexDirection: 'row' }]}>
                <View style={styles.logoContainer}>
                  <Logo width={LOGO_SIZE} height={LOGO_SIZE} />
                </View>
                
                <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.buttonShadow}>
                  <Pressable
                    style={({pressed}) => [
                      styles.optionButton,
                      selectedOption === 'option1' && styles.selectedButtonM,
                      pressed && styles.buttonPressed,
                      {backgroundColor: '#E0D6CC'}
                    ]}
                    onPress={() => handleOptionSelect('option1')}
                    android_ripple={{color: '#CCA479', borderless: false, radius: 41}}
                  >
                    <Text style={[
                      styles.optionButtonTextM,
                      selectedOption === 'option1' && styles.selectedButtonTextM
                    ]}>
                      М
                    </Text>
                  </Pressable>
                </Animated.View>
                
                <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.buttonShadow}>
                  <Pressable
                    style={({pressed}) => [
                      styles.optionButton,
                      selectedOption === 'option2' && styles.selectedButtonF,
                      pressed && styles.buttonPressed,
                      {backgroundColor: '#9A7859'}
                    ]}
                    onPress={() => handleOptionSelect('option2')}
                    android_ripple={{color: '#CCA479', borderless: false, radius: 41}}
                  >
                    <Text style={[
                      styles.optionButtonTextF,
                      selectedOption === 'option2' && styles.selectedButtonTextF
                    ]}>
                      Ж
                    </Text>
                  </Pressable>
                </Animated.View>
              </Animated.View>
            </View>
          </Animated.View>
          <Animated.View 
            style={styles.textContainer}
          >
            <Text style={styles.text}>
              ПОЛ
            </Text>
          </Animated.View>
        </Animated.View>
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
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  roundedBox: {
    width: '88%',
    height: '95%',
    borderRadius: 41,
    backgroundColor: 'rgba(205, 166, 122, 0)',
    position: 'relative',
    borderWidth: 3,
    borderColor: 'rgba(205, 166, 122, 0.4)',
  },
  gradientBackground: {
    borderRadius: 37,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    width: 33,
    height: 33,
  },
  formContainerShadow: {
    width: width * 0.88,
    top: -3,
    left: -3,
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
  buttonPressed: {
    opacity: 0.8,
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
  textContainer: {
    position: 'absolute',
    bottom: 0,
    marginBottom: 18,
    marginLeft: 27,
  },
  text: {
    fontFamily: 'IgraSans',
    fontSize: 38,
    color: '#fff',
  },
});

export default ConfirmationScreen; 