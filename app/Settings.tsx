import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated as RNAnimated,
  Easing,
  TextInput,
  FlatList,
  Keyboard,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import BackIcon from './assets/Back.svg';
import * as Haptics from 'expo-haptics';
import Cancel from './assets/Cancel.svg';
import Tick from './assets/Tick';

const { width, height } = Dimensions.get('window');

// Define a simpler navigation type that our custom navigation can satisfy
interface SimpleNavigation {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface SettingsProps {
  navigation: SimpleNavigation;
  onLogout?: () => void;
}

interface StatItem {
  label: string;
  value: string;
}

const Settings = ({ navigation, onLogout }: SettingsProps) => {
  const [selectedSize, setSelectedSize] = useState('M');
  const [activeSection, setActiveSection] = useState<'wall' | 'orders' | 'payment' | 'support' | null>(null);
  const [showSizeSelection, setShowSizeSelection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [popularBrands, setPopularBrands] = useState<string[]>([]);
  const [showBrandSearch, setShowBrandSearch] = useState(false);
  
  // Animation values
  const sizeContainerWidth = useRef(new RNAnimated.Value(height*0.1)).current;
  const sizeTextOpacity = useRef(new RNAnimated.Value(0)).current;
  const sizeIndicatorOpacity = useRef(new RNAnimated.Value(1)).current;
  const searchResultsTranslateY = useRef(new RNAnimated.Value(0)).current;
  const searchResultsOpacity = useRef(new RNAnimated.Value(0)).current;

  const stats: StatItem[] = [
    { label: 'Куплено', value: '56' },
    { label: 'Пролистано', value: '1,234' },
  ];

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL'];

  useEffect(() => {
    setPopularBrands([
      "Армани", "Бурберри", "Гуччи", "Хьюго Босс", 
      "Ральф Лорен", "Версаче", "Прада", "Кельвин Кляйн", 
      "Балман", "Фенди", "Том Форд", "Шанель"
    ]);
  }, []);

  const handleSizePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    RNAnimated.parallel([
      RNAnimated.timing(sizeContainerWidth, {
        toValue: width * 0.5,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false
      }),
      RNAnimated.timing(sizeTextOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }),
      RNAnimated.timing(sizeIndicatorOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true
      })
    ]).start(() => {
      setShowSizeSelection(true);
    });
  };

  const handleSizeSelect = (size: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSize(size);
    RNAnimated.parallel([
      RNAnimated.timing(sizeContainerWidth, {
        toValue: 45,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false
      }),
      RNAnimated.timing(sizeTextOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true
      }),
      RNAnimated.timing(sizeIndicatorOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start(() => {
      setShowSizeSelection(false);
    });
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSearchFocus = () => {
    setIsSearchActive(true);
    RNAnimated.parallel([
      RNAnimated.timing(searchResultsTranslateY, {
        toValue: -height*0.2,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      RNAnimated.timing(searchResultsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  };

  const handleCancelSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
    setIsSearchActive(false);
    RNAnimated.parallel([
      RNAnimated.timing(searchResultsTranslateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      RNAnimated.timing(searchResultsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
  };

  const handleBrandSelect = (brand: string) => {
    setSelectedBrands(prev => {
      if (prev.includes(brand)) {
        return prev.filter(b => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
  };

  const renderSizeSelection = () => (
    <View style={styles.sizeSelectionWrapper}>
      <RNAnimated.View 
        style={[
          styles.sizeSelectionContainer,
          { width: sizeContainerWidth }
        ]}
      >
        <RNAnimated.View style={[styles.sizeTextContainer, { opacity: sizeTextOpacity }]}>
          {sizeOptions.map((size) => (
            <Pressable 
              key={size} 
              style={styles.sizeTextWrapper}
              onPress={() => handleSizeSelect(size)}
            >
              <Text style={[
                styles.sizeText,
                selectedSize === size && styles.selectedSizeText
              ]}>
                {size}
              </Text>
            </Pressable>
          ))}
        </RNAnimated.View>
        <RNAnimated.View 
          style={[
            styles.sizeIndicator,
            { opacity: sizeIndicatorOpacity }
          ]}
        >
          <Text style={styles.sizeIndicatorText}>{selectedSize}</Text>
        </RNAnimated.View>
      </RNAnimated.View>
    </View>
  );

  const renderBrandSearch = () => (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.contentContainer}>
      <Animated.View style={styles.backButton} entering={FadeInDown.duration(500).delay(200)}>
        <TouchableOpacity onPress={() => setShowBrandSearch(false)}>
          <BackIcon width={33} height={33} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(250)}>
        <Text style={styles.sectionTitle}>Любимые бренды</Text>
      </Animated.View>

      {selectedBrands.length > 0 && (
        <Animated.View 
          entering={FadeInDown.duration(500)}
          exiting={FadeOutDown.duration(500)}
          style={styles.selectedBrandsContainer}
        >
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {selectedBrands.map((brand) => (
              <View key={brand} style={styles.selectedBrandItem}>
                <Text style={styles.selectedBrandText}>{brand}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      <View style={styles.searchAndResultsContainer}>
        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск"
            placeholderTextColor="rgba(0,0,0,1)"
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={handleSearchFocus}
          />
          {isSearchActive && (
            <TouchableOpacity
              onPress={handleCancelSearch}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <RNAnimated.View 
          style={[
            styles.searchResultsContainer,
            {
              transform: [{ translateY: searchResultsTranslateY }],
              opacity: searchResultsOpacity
            }
          ]}
        >
          <FlatList
            data={popularBrands.filter(brand => 
              brand.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={({ item }) => (
              <Pressable
                style={({pressed}) => [
                  styles.brandItem,
                  pressed && styles.pressedItem
                ]}
                onPress={() => handleBrandSelect(item)}
              >
                <Text style={styles.brandText}>{item}</Text>
              </Pressable>
            )}
            keyExtractor={(item) => item}
            numColumns={1}
            contentContainerStyle={styles.brandsList}
            showsVerticalScrollIndicator={false}
          />
        </RNAnimated.View>
      </View>
    </Animated.View>
  );

  const renderMainButton = (title: string, section: 'wall' | 'orders' | 'payment' | 'support', delay: number) => (
    <Animated.View
      entering={FadeInDown.duration(500).delay(150+delay)}
      style={styles.mainButtonContainer}
    >
      <Pressable 
        style={styles.mainButton}
        onPress={() => setActiveSection(section)}
      >
        <Text style={styles.mainButtonText}>{title}</Text>
      </Pressable>
    </Animated.View>
  );

  const renderMainButtons = () => (
    <Animated.View entering={FadeInDown.duration(500)} style={{width: '100%', alignItems: 'center', justifyContent: 'space-between', height: '100%'}}>
      {/* Profile Section */}
      <Animated.View entering={FadeInDown.duration(500).delay(100)}>
        <Text style={styles.profileName}>Иван Иванов</Text>
      </Animated.View>
            
      <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.profileImageContainer}>
        <Image 
          source={require('./assets/Vision.png')} 
          style={styles.profileImage}
        />
      </Animated.View>
      <Animated.View 
      //entering={FadeInDown.duration(500)}
      style={styles.mainButtonsOverlay}
    >
      {renderMainButton('Стена', 'wall', 50)}
      {renderMainButton('Заказы', 'orders', 100)}
      {renderMainButton('Способ оплаты', 'payment', 150)}
      {renderMainButton('Поддержка', 'support', 200)}
    </Animated.View>
    </Animated.View>
  );

  const renderWallContent = () => (
    <View style={styles.contentContainer}>
      {showBrandSearch ? renderBrandSearch() : (
        <>
          <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.profileSection}>
            <Text style={styles.profileName}>Иван Иванов</Text>
            <View style={styles.profileImageContainer}>
            <Image 
              source={require('./assets/Vision.png')} 
              style={styles.profileImage}
            />
            </View>
          </Animated.View>

          <Animated.View style={styles.backButton} entering={FadeInDown.duration(500).delay(200)}>
            <TouchableOpacity onPress={() => setActiveSection(null)}>
              <BackIcon width={33} height={33} />
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View entering={FadeInDown.duration(500).delay(250)} style={styles.favoriteBrandsSection}>
            <TouchableOpacity 
              style={styles.favoriteBrandsButton}
              onPress={() => setShowBrandSearch(true)}
            >
              <Text style={styles.favoriteBrandsText}>Любимые бренды</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <View style={styles.valueWrapper}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
               
              </View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.sizeSection}>
            <Text style={styles.sizeSectionTitle}>Размер</Text>
            <Pressable 
              style={styles.sizeSelectionWrapper}
              onPress={handleSizePress}
            >
              {renderSizeSelection()}
            </Pressable>
          </Animated.View>
        </>
      )}
    </View>
  );

  const renderOrdersContent = () => (
    <View style={styles.contentContainer}>
      <Animated.View style={styles.backButton} entering={FadeInDown.duration(500).delay(200)}>
        <TouchableOpacity onPress={() => setActiveSection(null)}>
          <BackIcon width={33} height={33} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(250)}>
        <Text style={styles.sectionTitle}>Заказы</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.ordersContainer}>
        <Text style={styles.emptyStateText}>У вас пока нет заказов</Text>
        <Pressable 
          style={styles.startShoppingButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.startShoppingText}>Начать покупки</Text>
        </Pressable>
      </Animated.View>
    </View>
  );

  const renderPaymentContent = () => (
    <View style={styles.contentContainer}>
      <Animated.View style={styles.backButton} entering={FadeInDown.duration(500).delay(200)}>
        <TouchableOpacity onPress={() => setActiveSection(null)}>
          <BackIcon width={33} height={33} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(250)}>
        <Text style={styles.sectionTitle}>Способ оплаты</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.paymentContainer}>
        <Pressable style={styles.paymentMethodButton}>
          <Text style={styles.paymentMethodText}>Добавить карту</Text>
        </Pressable>
        <Text style={styles.paymentInfoText}>
          Добавьте способ оплаты для быстрых покупок
        </Text>
      </Animated.View>
    </View>
  );

  const renderSupportContent = () => (
    <View style={styles.contentContainer}>
      <Animated.View style={styles.backButton} entering={FadeInDown.duration(500).delay(200)}>
        <TouchableOpacity onPress={() => setActiveSection(null)}>
          <BackIcon width={33} height={33} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(250)}>
        <Text style={styles.sectionTitle}>Поддержка</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.supportContainer}>
        <Pressable style={styles.supportButton}>
          <Text style={styles.supportButtonText}>Написать в поддержку</Text>
        </Pressable>
        <Pressable style={styles.supportButton}>
          <Text style={styles.supportButtonText}>FAQ</Text>
        </Pressable>
        <Pressable style={styles.supportButton}>
          <Text style={styles.supportButtonText}>Политика конфиденциальности</Text>
        </Pressable>
      </Animated.View>
    </View>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'wall':
        return renderWallContent();
      case 'orders':
        return renderOrdersContent();
      case 'payment':
        return renderPaymentContent();
      case 'support':
        return renderSupportContent();
      default:
        return renderMainButtons();
    }
  };

  const getBottomText = () => {
    switch (activeSection) {
      case 'wall':
        return 'СТЕНА';
      case 'orders':
        return 'ЗАКАЗЫ';
      case 'payment':
        return 'ОПЛАТА';
      case 'support':
        return 'ПОДДЕРЖКА';
      default:
        return 'НАСТРОЙКИ';
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInDown.duration(500)}
        style={styles.roundedBox}
      >
        <LinearGradient
          colors={["rgba(205, 166, 122, 0.4)", "rgba(205, 166, 122, 0)"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0.3 }}
          style={styles.gradientBackground}
        />
        
        {/* Content Box */}
        <View style={styles.whiteBox}>
          {renderContent()}
        </View>

        {/* Bottom Text */}
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            {getBottomText()}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  whiteBox: {
    backgroundColor: '#F2ECE7',
    borderRadius: 41,
    width: width*0.88,
    top: -3,
    left: -3,
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    padding: height*0.025,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    marginBottom: 12,
    marginLeft: 22,
  },
  text: {
    fontFamily: 'Igra Sans',
    fontSize: 38,
    color: '#FFF',
    textAlign: 'left',
  },
  profileSection: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 10
  },
  profileImageContainer: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    overflow: 'hidden',
    //backgroundColor: '#F2ECE7',
    //marginBottom: 15,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  profileName: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  mainButtonsOverlay: {
    width: '100%',
    justifyContent: 'center',
    marginBottom: -15
    //paddingVertical: 20,
  },
  mainButtonContainer: {
    marginBottom: 15,
  },
  mainButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E2CCB2',
    borderRadius: 41,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    height: height*0.1
  },
  mainButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  contentContainer: {
    width: '100%',
    height: '100%', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 11,
  },
  sectionTitle: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
    marginBottom: 15,
    marginTop: 60,
  },
  favoriteBrandsSection: {
    width: '100%',
    height: height*0.1,
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2ECE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  favoriteBrandsButton: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#E2CCB2',
    height: height*0.1,
    borderRadius: 41,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
  },
  favoriteBrandsText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 0.175*height, 
    alignItems: 'flex-end',
    width: '100%',
    backgroundColor: '#E2CCB2',
    borderRadius: 41,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  valueWrapper: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCBF9D',
    height: height*0.1,
    borderRadius: 41,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  statValue: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  statLabel: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
    marginBottom: 5,
    paddingHorizontal: 20
  },
  sizeSection: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#E2CCB2',
    height: height*0.1,
    borderRadius: 41,
    justifyContent: 'flex-start',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sizeSectionTitle: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
    marginLeft: 20,
    textAlign: 'left'
  },
  sizeSelectionWrapper: {
    height: '100%',
    position: 'absolute',
    right: 0,
    justifyContent: 'center',
  },
  sizeSelectionContainer: {
    height: '100%',
    minWidth: height*0.1,
    borderRadius: 41,
    backgroundColor: '#DCBF9D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'absolute',
    right: 0,
  },
  sizeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  sizeTextWrapper: {
    paddingVertical: 5,
    paddingHorizontal: 0,
    flex: 1,
    alignItems: 'center',
  },
  sizeText: {
    color: 'black',
    fontFamily: 'IgraSans',
    fontSize: 20,
    textAlign: 'center',
  },
  selectedSizeText: {
    textDecorationLine: 'underline',
    textDecorationColor: 'black',
    textDecorationStyle: 'solid',
  },
  sizeIndicator: {
    width: height*0.1,
    height: height*0.1,
    borderRadius: 41,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 0,
  },
  sizeIndicatorText: {
    color: 'black',
    fontFamily: 'IgraSans',
    fontSize: 20,
    textAlign: 'center',
  },
  bottomText: {
    fontFamily: 'IgraSans',
    fontSize: 38,
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
  // Orders styles
  ordersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontFamily: 'REM',
    fontSize: 16,
    color: '#6A462F',
    marginBottom: 20,
  },
  startShoppingButton: {
    backgroundColor: '#CDA67A',
    borderRadius: 15,
    padding: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  startShoppingText: {
    fontFamily: 'IgraSans',
    fontSize: 16,
    color: 'white',
  },
  // Payment styles
  paymentContainer: {
    padding: 20,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  paymentMethodText: {
    fontFamily: 'REM',
    fontSize: 16,
    color: '#6A462F',
  },
  paymentInfoText: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#CDA67A',
    textAlign: 'center',
  },
  // Support styles
  supportContainer: {
    padding: 20,
  },
  supportButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  supportButtonText: {
    fontFamily: 'REM',
    fontSize: 16,
    color: '#6A462F',
    textAlign: 'center',
  },
  brandSearchContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  selectedBrandsContainer: {
    width: '100%',
    maxHeight: 50,
    marginBottom: 20,
  },
  selectedBrandItem: {
    backgroundColor: '#DCC1A5',
    borderRadius: 41,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginHorizontal: 4,
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
  selectedBrandText: {
    fontFamily: 'IgraSans',
    fontSize: 22,
    color: '#000',
  },
  searchAndResultsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  searchContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0D6CC',
    borderRadius: 41,
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  searchInput: {
    flex: 1,
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
    height: 40,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 41,
    backgroundColor: '#CDA67A',
  },
  cancelButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  searchResultsContainer: {
    width: '100%',
    height: height*0.35,
    backgroundColor: '#E0D6CC',
    borderRadius: 41,
    overflow: 'hidden',
    marginTop: 10,
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
  brandsList: {
    paddingVertical: 8,
  },
  brandItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  brandText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  pressedItem: {
    opacity: 0.8,
  },
});

export default Settings; 