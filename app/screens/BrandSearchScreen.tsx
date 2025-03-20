import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
  Keyboard,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Logo from '../assets/Logo.svg';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width, height) * 0.2;

interface BrandSearchScreenProps {
  onComplete: (selectedBrands: string[]) => void;
  stylePreference: 'option1' | 'option2';
}

// Sample popular brands based on style preference
const getPopularBrands = (stylePreference: 'option1' | 'option2') => {
  // option1 = Casual style, option2 = Classic style
  if (stylePreference === 'option1') {
    return [
      "Ника", "Адидас", "Дольче Габбана", "Найк", 
      "Левис", "Пума", "Томми Хилфигер", "Зара", 
      "Аэропостале", "H&M", "GAP", "Рибок"
    ];
  } else {
    return [
      "Армани", "Бурберри", "Гуччи", "Хьюго Босс", 
      "Ральф Лорен", "Версаче", "Прада", "Кельвин Кляйн", 
      "Балман", "Фенди", "Том Форд", "Шанель"
    ];
  }
};

const BrandSearchScreen: React.FC<BrandSearchScreenProps> = ({ onComplete, stylePreference }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [popularBrands, setPopularBrands] = useState<string[]>([]);
  
  // Initialize popular brands based on style preference
  useEffect(() => {
    setPopularBrands(getPopularBrands(stylePreference));
  }, [stylePreference]);
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSearchFocus = () => {
    setIsSearchActive(true);
  };
  
  const handleBrandSelect = (brand: string) => {
    setSelectedBrands(prev => {
      // If brand is already selected, remove it
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      }
      // Otherwise add it (limited to max 3 brands)
      else if (prev.length < 3) {
        return [...prev, brand];
      }
      return prev;
    });
  };
  
  const handleCancelSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
    setIsSearchActive(false);
  };
  
  const handleContinue = () => {
    onComplete(selectedBrands);
  };
  
  // Filter brands based on search query
  const filteredBrands = searchQuery.length > 0
    ? popularBrands.filter(brand => 
        brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : popularBrands;
  
  const renderBrandItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.brandItem,
        selectedBrands.includes(item) && styles.selectedBrandItem
      ]}
      onPress={() => handleBrandSelect(item)}
    >
      <Text style={[
        styles.brandText,
        selectedBrands.includes(item) && styles.selectedBrandText
      ]}>
        {item}
      </Text>
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
              Выберите ваши любимые бренды
            </Text>
            
            <Text style={styles.subHeaderText}>
              Выберите до 3 брендов для индивидуальных рекомендаций
            </Text>
            
            <Animated.View 
              entering={FadeInDown.duration(400).delay(200)}
              style={[
                styles.searchContainer,
                isSearchActive && styles.searchContainerActive
              ]}
            >
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={[
                    styles.searchInput,
                    isSearchActive && styles.searchInputActive
                  ]}
                  placeholder="Найти бренд"
                  placeholderTextColor="rgba(0,0,0,0.6)"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  onFocus={handleSearchFocus}
                />
                
                {isSearchActive && (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    style={styles.cancelButtonContainer}
                  >
                    <TouchableOpacity
                      onPress={handleCancelSearch}
                      style={styles.cancelButton}
                    >
                      <Text style={styles.cancelButtonText}>Отмена</Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
            </Animated.View>
            
            <View style={styles.brandsContainer}>
              <FlatList
                data={filteredBrands}
                renderItem={renderBrandItem}
                keyExtractor={(item) => item}
                numColumns={2}
                contentContainerStyle={styles.brandsList}
              />
            </View>
            
            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>
                Выбрано: {selectedBrands.length}/3
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
  searchContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  searchContainerActive: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 41,
    backgroundColor: 'rgba(154, 125, 97, 0.2)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchInput: {
    flex: 1,
    height: 45,
    paddingHorizontal: 20,
    fontSize: 15,
    fontFamily: 'REM',
    color: '#000',
  },
  searchInputActive: {
    flex: 0.82, // Make room for the cancel button
  },
  cancelButtonContainer: {
    marginLeft: 'auto',
  },
  cancelButton: {
    paddingHorizontal: 12,
    height: 45,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#4A3120',
    fontSize: 14,
    fontFamily: 'REM',
  },
  brandsContainer: {
    width: '100%',
    flex: 1,
    marginBottom: 10,
  },
  brandsList: {
    paddingVertical: 5,
  },
  brandItem: {
    flex: 1,
    margin: 5,
    padding: 15,
    borderRadius: 25,
    backgroundColor: 'rgba(154, 125, 97, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  selectedBrandItem: {
    backgroundColor: '#9A7D61',
  },
  brandText: {
    fontFamily: 'IgraSans',
    fontSize: 14,
    color: '#4A3120',
    textAlign: 'center',
  },
  selectedBrandText: {
    color: '#FFFFFF',
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

export default BrandSearchScreen; 