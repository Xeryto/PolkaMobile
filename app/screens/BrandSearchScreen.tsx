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
  Dimensions,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Logo from '../assets/Logo.svg';
import BackIcon from '../assets/Back.svg';

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width, height) * 0.275;

interface BrandSearchScreenProps {
  onComplete: (selectedBrands: string[]) => void;
  onBack?: () => void; // Optional back handler
}

// Sample popular brands based on style preference
const getPopularBrands = () => {
  return [
    "Армани", "Бурберри", "Гуччи", "Хьюго Босс", 
    "Ральф Лорен", "Версаче", "Прада", "Кельвин Кляйн", 
    "Балман", "Фенди", "Том Форд", "Шанель"
  ];
};

const BrandSearchScreen: React.FC<BrandSearchScreenProps> = ({ onComplete, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [popularBrands, setPopularBrands] = useState<string[]>([]);
  
  // Initialize popular brands based on style preference
  useEffect(() => {
    setPopularBrands(getPopularBrands());
  }, []);
  
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
    <Pressable
      style={({pressed}) => [
        styles.brandItem,
        selectedBrands.includes(item) && styles.selectedBrandItem,
        pressed && styles.pressedItem
      ]}
      onPress={() => handleBrandSelect(item)}
      android_ripple={{color: 'rgba(205, 166, 122, 0.3)', borderless: false}}
    >
      <Text style={[
        styles.brandText,
        selectedBrands.includes(item) && styles.selectedBrandText
      ]}>
        {item}
      </Text>
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
      <Animated.View style={styles.roundedBox} entering={FadeInDown.duration(500)}>
        <LinearGradient
          colors={["rgba(205, 166, 122, 0.5)", "transparent"]}
          start={{ x: 0.1, y: 1 }}
          end={{ x: 0.9, y: 0.3 }}
          locations={[0.05, 1]}
          style={styles.gradientBackground}
        />
        <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
              <BackIcon width={33} height={33} />
          </TouchableOpacity>
        <View style={styles.formContainerShadow}>
          <Animated.View 
            style={styles.formContainer}
          >
            <Animated.View style={styles.logoContainer}>
              <Logo width={LOGO_SIZE} height={LOGO_SIZE} />
            </Animated.View>
            
            
            <Animated.View 
              entering={FadeInDown.duration(500).delay(50)}
              style={[
                styles.searchContainer,
                isSearchActive && styles.searchContainerActive
              ]}
            >
              <View style={styles.searchInputContainer}>
                <TextInput
                  style={[
                    styles.searchInput
                  ]}
                  placeholder="Поиск"
                  placeholderTextColor="rgba(0,0,0,1)"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  onFocus={handleSearchFocus}
                />
                
                {isSearchActive && (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    style={styles.cancelButtonContainer}
                  >
                    <Pressable
                      onPress={handleCancelSearch}
                      style={({pressed}) => [
                        styles.cancelButton,
                        pressed && styles.pressedItem
                      ]}
                      android_ripple={{color: '#4A3120', borderless: false}}
                    >
                      <Text style={styles.cancelButtonText}>Отмена</Text>
                    </Pressable>
                  </Animated.View>
                )}
              </View>
            </Animated.View>
            
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.brandsContainer}>
              <FlatList
                data={filteredBrands}
                renderItem={renderBrandItem}
                keyExtractor={(item) => item}
                numColumns={1}
                contentContainerStyle={styles.brandsList}
              />
            </Animated.View>
            
            <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.buttonContainer}>
              <Pressable 
                style={({pressed}) => [
                  styles.continueButton,
                  pressed && styles.pressedItem
                ]}
                onPress={handleContinue}
                android_ripple={{color: '#4A3120', borderless: false}}
              >
                <Text style={styles.continueButtonText}>
                  Продолжить
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
        <Animated.View 
            style={styles.textContainer}
          >
            <Text style={styles.text}>
              БРЕНДЫ
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
    paddingTop: Platform.OS === 'ios' ? 0 : 30,
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
    top: 21,
    left: 21,
    zIndex: 10,
    width: 33,
    height: 33,
  },
  formContainerShadow: {
    top: -3,
    left: -3,
    width: width*0.88,
    height: '90%',
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
    height: '100%',
    backgroundColor: '#F2ECE7',
    borderRadius: 41,
    padding: 21,
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
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  searchContainer: {
    width: '100%',
    borderRadius: 41,
    backgroundColor: '#E0D6CC',
    marginBottom: 20,
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
  searchContainerActive: {
    backgroundColor: '#DFD6CC',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
    height: '100%',
    paddingHorizontal: 20,
    paddingVertical: 45,
  },
  cancelButtonContainer: {
    //marginLeft: 10,
  },
  cancelButton: {
    paddingHorizontal: 30,
    paddingVertical: 45,
    borderRadius: 41,
    backgroundColor: '#CDA67A',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  brandsContainer: {
    width: '100%',
    flex: 1,
  },
  brandsList: {
    paddingBottom: 10,
  },
  brandItem: {
    flex: 1,
    margin: 6,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#E0D6CC',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
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
  selectedBrandItem: {
    backgroundColor: '#CDA67A',
  },
  pressedItem: {
    opacity: 0.8,
  },
  brandText: {
    fontFamily: 'IgraSans',
    fontSize: 16,
    color: '#4A3120',
    textAlign: 'center',
  },
  selectedBrandText: {
    color: '#FFF',
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
    alignItems: 'flex-end',
  },
  continueButton: {
    backgroundColor: '#E0D6CC',
    borderRadius: 41,
    paddingVertical: 16,
    paddingHorizontal: 25,
    alignItems: 'center',
    //marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
        overflow: 'hidden'
      },
    }),
  },
  continueButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
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

export default BrandSearchScreen; 