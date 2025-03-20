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
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import Logo from '../assets/Logo.svg';

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
  stylePreference: 'option1' | 'option2'; // Gender preference from confirmation screen
}

const StylesSelectionScreen: React.FC<StylesSelectionScreenProps> = ({ onComplete, stylePreference }) => {
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
    <TouchableOpacity
      style={[
        styles.styleItem,
        selectedStyles.includes(item.id) && styles.selectedStyleItem
      ]}
      onPress={() => handleStyleSelect(item.id)}
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
    </TouchableOpacity>
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
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={handleContinue}
              >
                <Text style={styles.continueButtonText}>
                  Продолжить
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={() => onComplete([])}
              >
                <Text style={styles.skipButtonText}>
                  Пропустить
                </Text>
              </TouchableOpacity>
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
    color: 'rgba(0, 0, 0, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  stylesContainer: {
    width: '100%',
    flex: 1,
    marginBottom: 10,
  },
  stylesList: {
    paddingVertical: 5,
  },
  styleItem: {
    flex: 1,
    margin: 5,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedStyleItem: {
    borderWidth: 3,
    borderColor: '#4A3120',
  },
  styleImageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  styleImage: {
    borderRadius: 20,
  },
  styleOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 10,
  },
  styleName: {
    fontFamily: 'IgraSans',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  styleDescription: {
    fontFamily: 'REM',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4A3120',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedCount: {
    marginVertical: 10,
  },
  selectedCountText: {
    fontFamily: 'REM',
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  continueButton: {
    backgroundColor: '#4A3120',
    borderRadius: 41,
    paddingVertical: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  continueButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 18,
    color: '#F2ECE7',
  },
  skipButton: {
    borderRadius: 41,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 16,
    color: '#4A3120',
  },
});

export default StylesSelectionScreen; 