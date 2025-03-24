import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  SafeAreaView,
  FlatList,
  ImageBackground,
  Dimensions,
  Image,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import Logo from '../assets/Logo.svg';
import BackIcon from '../assets/Back.svg';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width, height) * 0.2;

// Style option interface
interface StyleOption {
  id: string;
  name: string;
  description: string;
}

// Mock style options - in a real app, these would come from an API
const STYLE_OPTIONS: StyleOption[] = [
  { 
    id: 'casual', 
    name: 'Повседневный', 
    description: 'Комфортная одежда для ежедневной носки'
  },
  { 
    id: 'formal', 
    name: 'Деловой', 
    description: 'Элегантная одежда для офиса и встреч'
  },
  { 
    id: 'sport', 
    name: 'Спортивный', 
    description: 'Функциональная одежда для активного образа жизни'
  },
  { 
    id: 'romantic', 
    name: 'Романтичный', 
    description: 'Женственные, изящные силуэты'
  },
  { 
    id: 'streetwear', 
    name: 'Уличный', 
    description: 'Современный городской стиль'
  },
  { 
    id: 'vintage', 
    name: 'Винтаж', 
    description: 'Классические силуэты прошлых десятилетий'
  },
  { 
    id: 'minimalist', 
    name: 'Минимализм', 
    description: 'Простые, лаконичные силуэты и нейтральные цвета'
  },
  { 
    id: 'bohemian', 
    name: 'Богемный', 
    description: 'Свободные силуэты и этнические мотивы'
  }
];

interface StylesSelectionScreenProps {
  onComplete: (selectedStyles: string[]) => void;
  onBack?: () => void; // Optional back handler
}

const StylesSelectionScreen: React.FC<StylesSelectionScreenProps> = ({ onComplete, onBack }) => {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  
  // Filter style options based on gender preference if needed
  const styleOptions = STYLE_OPTIONS;
  
  const handleStyleSelect = (id: string) => {
    setSelectedStyles(prev => {
      // If style is already selected, remove it
      if (prev.includes(id)) {
        return prev.filter(styleId => styleId !== id);
      }
      // Otherwise add it (limited to max 5 styles)
      else if (prev.length < 5) {
        return [...prev, id];
      }
      return prev;
    });
  };
  
  const handleContinue = () => {
    onComplete(selectedStyles);
  };
  
  const renderStyleItem = ({ item }: { item: StyleOption }) => (
    <Pressable
      style={({pressed}) => [
        styles.styleItem,
        selectedStyles.includes(item.id) && styles.selectedStyleItem,
        pressed && styles.pressedStyleItem
      ]}
      onPress={() => handleStyleSelect(item.id)}
      android_ripple={{color: 'rgba(205, 166, 122, 0.3)', borderless: false}}
    >
        <View style={styles.styleOverlay}>
          <Text style={styles.styleName}>{item.name}</Text>
          <Text style={styles.styleDescription}>{item.description}</Text>
        </View>
        
        {selectedStyles.includes(item.id) && (
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
    </Pressable>
  );
  
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
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <BackIcon width={33} height={33} />
          </TouchableOpacity>
        )}
        <View style={styles.formContainerShadow}>
          <Animated.View 
            entering={FadeIn.duration(800)}
            style={styles.formContainer}
          >
            <View style={styles.logoContainer}>
              <Logo width={LOGO_SIZE} height={LOGO_SIZE} />
            </View>
            
            <Text style={styles.headerText}>
              Выберите ваши любимые стили
            </Text>
            
            <Text style={styles.subHeaderText}>
              Выберите до 5 стилей для индивидуальных рекомендаций
            </Text>
            
            <View style={styles.stylesContainer}>
              <FlatList
                data={styleOptions}
                renderItem={renderStyleItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.stylesList}
              />
            </View>
            
            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>
                Выбрано: {selectedStyles.length}/5
              </Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <Pressable 
                style={({pressed}) => [
                  styles.continueButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={handleContinue}
                android_ripple={{color: '#4A3120', borderless: false}}
              >
                <Text style={styles.continueButtonText}>
                  Продолжить
                </Text>
              </Pressable>
              
              <Pressable 
                style={({pressed}) => [
                  styles.skipButton,
                  pressed && styles.buttonPressed
                ]}
                onPress={() => onComplete([])}
                android_ripple={{color: '#CDA67A', borderless: false}}
              >
                <Text style={styles.skipButtonText}>
                  Пропустить
                </Text>
              </Pressable>
            </View>
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
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainerShadow: {
    width: '100%',
    maxHeight: height * 0.85,
    borderRadius: 41,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#F2ECE7',
    borderRadius: 41,
    padding: 25,
    paddingBottom: 30,
    alignItems: 'center',
    ...Platform.select({
      android: {
        overflow: 'hidden',
      },
    }),
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  headerText: {
    fontFamily: 'IgraSans',
    fontSize: 24,
    color: '#4A3120',
    textAlign: 'center',
    marginBottom: 8,
  },
  subHeaderText: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#4A3120',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  stylesContainer: {
    width: '100%',
  },
  stylesList: {
    paddingBottom: 10,
  },
  styleItem: {
    flex: 1,
    height: 100,
    margin: 6,
    borderRadius: 12,
    backgroundColor: '#E0D6CC',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pressedStyleItem: {
    opacity: 0.8,
  },
  selectedStyleItem: {
    backgroundColor: '#CDA67A',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  styleOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleName: {
    fontFamily: 'IgraSans',
    fontSize: 16,
    color: '#4A3120',
    textAlign: 'center',
    marginBottom: 4,
  },
  styleDescription: {
    fontFamily: 'REM',
    fontSize: 10,
    color: '#4A3120',
    textAlign: 'center',
    opacity: 0.8,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4A3120',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 14,
  },
  selectedCount: {
    marginTop: 12,
    marginBottom: 16,
  },
  selectedCountText: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#4A3120',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    width: '80%',
    backgroundColor: '#CDA67A',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
        overflow: 'hidden'
      },
    }),
  },
  continueButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 18,
    color: '#FFF',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden'
  },
  skipButtonText: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#4A3120',
    textDecorationLine: 'underline',
  },
});

export default StylesSelectionScreen; 