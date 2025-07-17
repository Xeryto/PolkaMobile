import React, { useState, useEffect, useRef } from 'react';
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
  Pressable,
  ScrollView,
  LayoutChangeEvent,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeOutDown, 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
} from 'react-native-reanimated';
import Logo from '../assets/Logo.svg';
import BackIcon from '../assets/Back.svg';
import Tick from '../assets/Tick';
import Cancel from '../assets/Cancel.svg';
import * as api from '../services/api';
const { width, height } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width, height) * 0.275;

interface BrandSearchScreenProps {
  onComplete: (selectedBrands: number[]) => void;
  onBack?: () => void; // Optional back handler
  initialBrands?: number[]; // Initial selected brands
}

const BrandSearchScreen: React.FC<BrandSearchScreenProps> = ({ onComplete, onBack, initialBrands = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<number[]>(initialBrands);
  const [brands, setBrands] = useState<{id: number, name: string}[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [visibleBubblesHeight, setVisibleBubblesHeight] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation values
  const searchResultsHeight = useSharedValue(height*0.125);
  const searchResultsOpacity = useSharedValue(0);
  const bubblesHeight = useSharedValue(height*0.2);
  
  // Fetch brands from API on mount
  useEffect(() => {
    setIsLoadingBrands(true);
    api.getBrands().then((brandList: any[]) => {
      setBrands(brandList.map(b => ({ id: b.id, name: b.name })));
      setIsLoadingBrands(false);
    }).catch(err => {
      setBrands([]);
      setIsLoadingBrands(false);
    });
  }, []);
  
  // Handle animation when search becomes active
  useEffect(() => {
    if (isSearchActive) {
      searchResultsHeight.value = withTiming(height*0.35, { duration: 300 });
      searchResultsOpacity.value = withTiming(1, { duration: 300 });
      bubblesHeight.value = withTiming(height*0.125, { duration: 300 });
    } else {
      searchResultsHeight.value = withTiming(height*0.125, { duration: 300 });
      searchResultsOpacity.value = withTiming(0, { duration: 300 });
      bubblesHeight.value = withTiming(height*0.2, { duration: 300 });
    }
  }, [isSearchActive]);
  
  // Animated styles for search results container
  const searchResultsAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: searchResultsHeight.value,
      opacity: searchResultsOpacity.value,
    };
  });

  const bubblesAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: bubblesHeight.value,
    };
  });
  
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSearchFocus = () => {
    setIsSearchActive(true);
  };
  
  const handleBrandSelect = (brand: number) => {
    setSelectedBrands(prev => {
      // If brand is already selected, remove it
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      }
      // Otherwise add it (no limit)
      else {
        return [...prev, brand];
      }
    });
  };
  
  const handleCancelSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
    setIsSearchActive(false);
  };
  
  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      await api.updateUserBrands(selectedBrands);
      onComplete(selectedBrands);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить любимые бренды. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle bubble container layout to measure height
  const handleBubblesLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setVisibleBubblesHeight(height > 0 ? height : 0);
  };
  
  // Filter brands based on search query
  const filteredBrands = searchQuery.length > 0
    ? brands.filter(brand => 
        brand.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : brands;
  
  // Render a selected brand bubble
  const renderBrandBubble = (brandId: number, index: number) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return null;
    
    return (
      <View key={`bubble-${brandId}`} style={{flexDirection: 'row', alignItems: 'center', marginRight: 11, marginBottom: 5}}>
        <View style={styles.brandBubble}>
          <Text style={styles.brandBubbleText}>{brand.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeBubbleIcon}
          onPress={() => handleBrandSelect(brandId)}
        >
          <Cancel width={18} height={18} />
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderBrandItem = ({ item }: { item: {id: number, name: string} }) => (
    <Pressable
      style={({pressed}) => [
        styles.brandItem,
        pressed && styles.pressedItem
      ]}
      onPress={() => handleBrandSelect(item.id)}
      android_ripple={{color: 'rgba(205, 166, 122, 0.3)', borderless: false}}
    >
      <View style={styles.brandItemContent}>
        <Text style={
          styles.brandText}>
          {item.name}
        </Text>
        
        {selectedBrands.includes(item.id) && (
          <View style={styles.tickContainer}>
            <Tick width={20} height={20} />
          </View>
        )}
      </View>
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
            
            <View style={styles.searchAndResultsContainer}>
            {/* Search Container */}
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
                    exiting={FadeOutDown.duration(200)}
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
            
            
            {/* Animated Search Results Container */}
            <Animated.View 
              style={[
                styles.searchResultsContainer,
                searchResultsAnimatedStyle,
                {
                  paddingTop: isSearchActive ? 110 : 0,
                }
              ]}
            >
              {isLoadingBrands ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Загрузка брендов...</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredBrands}
                  renderItem={renderBrandItem}
                  keyExtractor={(item) => item.id.toString()}
                  numColumns={1}
                  contentContainerStyle={styles.brandsList}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </Animated.View>

            {/* Selected brands bubbles */}
            
              <Animated.View 
                entering={FadeInDown.duration(300)}
                style={[
                  styles.selectedBubblesContainer,
                  bubblesAnimatedStyle
                ]}
                onLayout={handleBubblesLayout}
              >
                <ScrollView 
                  horizontal={false}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.selectedBubblesContent}
                  style={{borderRadius: 25}}
                >
                  <View style={styles.bubblesRow}>
                    {selectedBrands.map(brandId => renderBrandBubble(brandId, 0))}
                  </View>
                </ScrollView>
              </Animated.View>
            
            </View>
            
            <Animated.View 
              entering={FadeInDown.duration(500).delay(100)} 
              style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={handleContinue}
                disabled={isSubmitting}
              >
                <Text style={styles.continueButtonText}>
                  {isSubmitting ? 'Сохранение...' : 'Продолжить'}
                </Text>
              </TouchableOpacity>
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
    justifyContent:'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: LOGO_SIZE,
    marginBottom: 25,
  },
  searchAndResultsContainer: {
    width: '100%',
    height: 0.7*height-LOGO_SIZE-52-25,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  searchContainer: {
    width: '100%',
    borderRadius: 41,
    backgroundColor: '#E0D6CC',
    zIndex: 10,
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
  selectedBubblesContainer: {
    width: '100%',
    marginVertical: 10,
    borderRadius: 41,
  },
  selectedBubblesContent: {
    flexDirection: 'column',
  },
  bubblesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  brandBubble: {
    backgroundColor: '#DCC1A5',
    borderRadius: 41,
    paddingHorizontal: 18,
    paddingVertical: 12,
    margin: 4,
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
  brandBubbleText: {
    fontFamily: 'IgraSans',
    fontSize: 22,
    color: '#000',
  },
  removeBubbleIcon: {
    marginLeft: 4,
    width: 20,
    height: 20,
    borderRadius: 41,
    backgroundColor: '#DCB0A5',
    justifyContent: 'center',
    alignItems: 'center',
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
  searchResultsContainer: {
    width: '100%',
    zIndex: 5,
    backgroundColor: '#E0D6CC',
    borderRadius: 41,
    marginTop: -110,
    height: 110,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  brandsContainer: {
    width: '100%',
    flex: 1,
  },
  brandsList: {
    paddingVertical: 8,
  },
  brandItem: {
    flex: 1,
    margin: 6,
    padding: 15,
  },
  brandItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedBrandItem: {
    backgroundColor: '#CDA67A',
  },
  pressedItem: {
    opacity: 0.8,
  },
  brandText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  selectedBrandText: {
    color: '#FFF',
  },
  tickContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  selectedBubblesHeader: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
  },
  selectedBubblesTitle: {
    fontFamily: 'IgraSans',
    fontSize: 12,
    color: '#4A3120',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
});

export default BrandSearchScreen; 