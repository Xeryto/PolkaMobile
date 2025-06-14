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
  Platform,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeOutDown,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSequence,
  FadeOut
} from 'react-native-reanimated';
import BackIcon from './assets/Back.svg';
import * as Haptics from 'expo-haptics';
import Tick from './assets/Tick';
import { Canvas, RoundedRect, Shadow } from '@shopify/react-native-skia';
import {AnimatedCircularProgress} from 'react-native-circular-progress';

const { width, height } = Dimensions.get('window');

// Define a simpler navigation type that our custom navigation can satisfy
interface SimpleNavigation {
  navigate: (screen: string, params?: any) => void;
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

const CartItemImage = ({ item }: { item: CartItem }) => {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const onImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
  };

  const aspectRatio = imageDimensions.width && imageDimensions.height
    ? imageDimensions.width / imageDimensions.height
    : 1; // Default to 1 if image dimensions are not loaded yet

  return (
    <View style={styles.container}>
      <Image
        source={item.image}
        style={[styles.itemImage, { aspectRatio }]} // Set aspect ratio dynamically
        resizeMode="contain" // Ensure the image fits within the container while maintaining aspect ratio
        onLoad={onImageLoad} // Get image dimensions when the image loads
      />
    </View>
  );
};

const Settings = ({ navigation, onLogout }: SettingsProps) => {
  const [selectedSize, setSelectedSize] = useState('M');
  const [activeSection, setActiveSection] = useState<'wall' | 'orders' | 'payment' | 'support' | null>(null);
  const [showSizeSelection, setShowSizeSelection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [popularBrands, setPopularBrands] = useState<string[]>([]);
  const [showBrandSearch, setShowBrandSearch] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; number: string; items: any[]; total: string; } | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Animation values
  const sizeContainerWidth = useRef(new RNAnimated.Value(height*0.1)).current;
  const sizeTextOpacity = useRef(new RNAnimated.Value(0)).current;
  const sizeIndicatorOpacity = useRef(new RNAnimated.Value(1)).current;
  const searchResultsTranslateY = useRef(new RNAnimated.Value(0)).current;
  const searchResultsOpacity = useRef(new RNAnimated.Value(0)).current;
  const selectedBrandsOpacity = useSharedValue(0);

  const stats: StatItem[] = [
    { label: 'Куплено', value: '56' },
    { label: 'Пролистано', value: '1,234' },
  ];

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL'];

  // Filtered brands based on search query
  const filteredBrands = searchQuery.length > 0
    ? popularBrands.filter(brand => 
        brand.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : popularBrands;

  // Animated style for search results
  const searchResultsAnimatedStyle = {
    transform: [{ translateY: searchResultsTranslateY }],
    opacity: searchResultsOpacity
  };

  useEffect(() => {
    setPopularBrands([
      "Армани", "Бурберри", "Гуччи", "Хьюго Босс", 
      "Ральф Лорен", "Версаче", "Прада", "Кельвин Кляйн", 
      "Балман", "Фенди", "Том Форд", "Шанель"
    ]);
  }, []);

  useEffect(() => {
    if (selectedBrands.length > 0) {
      selectedBrandsOpacity.value = withTiming(1, { duration: 300 });
    } else {
      selectedBrandsOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [selectedBrands]);

  const selectedBrandsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: selectedBrandsOpacity.value,
      height: selectedBrandsOpacity.value === 0 ? 0 : 0.1 * height,
      marginTop: selectedBrandsOpacity.value === 0 ? 0 : height * 0.05,
    };
  });

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

  const handleSupportSend = async () => {
    if (!supportMessage.trim()) return;
    
    setIsSending(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setShowThankYou(true);
    setSupportMessage('');
    setIsSending(false);
    
    // Hide thank you message after 2 seconds
    setTimeout(() => {
      setShowThankYou(false);
    }, 2000);
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

  const renderBrandBubble = (brand: string) => (
    <Animated.View key={`bubble-${brand}`} style={{alignItems: 'center', marginRight: 11}}>
      <Text style={styles.brandBubbleText}>{brand}</Text>
    </Animated.View>
  );

  const renderBrandItem = ({ item }: { item: string }) => (
    <Pressable
      style={({pressed}) => [
        styles.brandItem,
        pressed && styles.pressedItem
      ]}
      onPress={() => handleBrandSelect(item)}
      android_ripple={{color: 'rgba(205, 166, 122, 0.3)', borderless: false}}
    >
      <View style={styles.brandItemContent}>
        <Text style={
          styles.brandText}>
          {item}
        </Text>
        
        {selectedBrands.includes(item) && (
          <View style={styles.tickContainer}>
            <Tick width={20} height={20} />
          </View>
        )}
      </View>
    </Pressable>
  );

  const renderBrandSearch = () => (
    <View style={styles.searchAndResultsContainer}>
      <Animated.View style={styles.backButton} entering={FadeInDown.duration(500).delay(200)}>
        <TouchableOpacity onPress={() => setShowBrandSearch(false)}>
          <BackIcon width={33} height={33} />
        </TouchableOpacity>
      </Animated.View>

      {/* Selected brands bubbles */}
          <Animated.View 
        entering={FadeInDown.duration(500).delay(250)}
        style={[
          styles.selectedBubblesContainer,
          selectedBrandsAnimatedStyle
        ]}
      >
        <ScrollView 
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectedBubblesContent}
        >
          {selectedBrands.map(renderBrandBubble)}
        </ScrollView>
          </Animated.View>
      
      {/* Search Container */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(300)} 
        style={styles.searchResultsContainer}
      >
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск"
            placeholderTextColor="rgba(0,0,0,1)"
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={handleSearchFocus}
          />
        </View>
        <FlatList
          data={filteredBrands}
          renderItem={renderBrandItem}
          keyExtractor={(item) => item}
          numColumns={1}
          contentContainerStyle={styles.brandsList}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
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
        <Text style={styles.profileName}>Рейтинг стиля</Text>
      </Animated.View>
            
      <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.ratingContainer}>
      <AnimatedCircularProgress
                size={height * 0.125}
                width={10}
                fill={67}
                tintColor="#B59679"
                backgroundColor="#32261B"
                rotation={225}
                arcSweepAngle={270}
                lineCap="round"
                padding={10}
                delay={200}
              >
                {() => (
                  <Text style={styles.ratingText}>67</Text>
                )}
              </AnimatedCircularProgress>
      </Animated.View>
      <View style={styles.ratingContainer}>
              
            </View>
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

  // Handle item press to send it to MainPage
  const handleItemPress = (item: CartItem) => {
    // Create a card item from the cart item
    const cardItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      isLiked: item.isLiked // Default to not liked when coming from cart
    };
    
    // Navigate to home with the item
    console.log('Cart - Sending item to MainPage:', cardItem);
    navigation.navigate('Home', { addCardItem: cardItem });
  };

  const renderOrderDetails = () => (
    <View style={styles.contentContainer}>
      <Animated.View style={styles.backButton} entering={FadeInDown.duration(500).delay(200)}>
        <TouchableOpacity onPress={() => setSelectedOrder(null)}>
          <BackIcon width={33} height={33} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.orderDetailsContainer}>
        <ScrollView style={styles.orderItemsList} showsVerticalScrollIndicator={false}>
          {selectedOrder?.items.map((item, index) => (
          <Animated.View 
            key={item.cartItemId || `${item.id}-${item.size}-${index}`}
            entering={FadeInDown.duration(500).delay(100 + index * 50)}
            style={styles.cartItem}
          >
            <Pressable 
              style={styles.itemPressable}
              onPress={() => handleItemPress(item)}
            >
              <View style={styles.itemContent}>
                  <View style={styles.imageContainer}>
                    <CartItemImage item={item} />
                  </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                  <Text style={styles.itemPrice}>{item.price}</Text>
                  <Text style={styles.itemSize}>{item.size}</Text>
                  
                  {/* Always display delivery info for each item */}
                  <View>
                    <Text style={[styles.deliveryText,{textDecorationLine: 'underline'}]}>
                      tracking number
                    </Text>
                    <Text style={styles.deliveryText}>
                      доставка
                    </Text>
                  </View>

                  <View style={styles.deliveryInfoChangeable}>
                    <Text style={styles.deliveryText}>
                      {item.delivery.cost}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.rightContainer}>
                <View style={styles.circle}>
                <Canvas style={{ width: 41, height: 41, backgroundColor: 'transparent' }}>
                  <RoundedRect x={0} y={0} width={41} height={41} r={20.5} color="white">
                    <Shadow dx={0} dy={4} blur={4} color="rgba(0,0,0,0.5)" inner />
                  </RoundedRect>
                </Canvas>
                </View>
              </View>
            </Pressable>
          </Animated.View>
          ))}
        </ScrollView>
        <Animated.View entering={FadeInDown.duration(500).delay(350)} style={styles.orderTotalContainer}>
          <Text style={styles.orderTotalText}>ИТОГО {selectedOrder?.total}</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.orderStatusContainer}>
          <Text style={[styles.orderStatusText, {marginLeft: 20}]}>Статус</Text>
          <Animated.View entering={FadeInDown.duration(500).delay(450)} style={styles.orderStatus}>
          <Text style={styles.orderStatusText}>Оплачен</Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );

  const renderOrdersContent = () => {
    const orders = [
      { 
        id: '1', 
        number: '12345', 
        items: [
          { id: '1', name: 'Nike', price: '15 000 р', size: 'M', image: require('./assets/Vision.png'), delivery: { cost: '350 р', estimatedTime: '1-3 дня' } },
          { id: '2', name: 'Levi\'s', price: '20 000 р', size: 'L', image: require('./assets/Vision.png'), delivery: { cost: '350 р', estimatedTime: '1-3 дня' } },
          { id: '3', name: 'Adidas', price: '10 000 р', size: '42', image: require('./assets/Vision.png'), delivery: { cost: '350 р', estimatedTime: '1-3 дня' } }
        ],
        total: '45 000 р', 
        date: '12.03.2024' 
      },
      { 
        id: '2', 
        number: '12346', 
        items: [
          { id: '4', name: 'Куртка The North Face', price: '15 000 р', size: 'XL', image: require('./assets/Vision.png'), delivery: { cost: '350 р', estimatedTime: '1-3 дня' } }
        ],
        total: '15 000 р', 
        date: '10.03.2024' 
      },
      { 
        id: '3', 
        number: '12347', 
        items: [
          { id: '5', name: 'Рубашка Tommy Hilfiger', price: '20 000 р', size: 'M', image: require('./assets/Vision.png'), delivery: { cost: '350 р', estimatedTime: '1-3 дня' } },
          { id: '6', name: 'Брюки Calvin Klein', price: '10 000 р', size: 'L', image: require('./assets/Vision.png'), delivery: { cost: '350 р', estimatedTime: '1-3 дня' } }
        ],
        total: '30 000 р', 
        date: '08.03.2024' 
      },
      { 
        id: '4', 
        number: '12367', 
        items: [
          { id: '5', name: 'Рубашка Tommy Hilfiger', price: '20 000 р', size: 'M', image: require('./assets/Vision.png'), delivery: { cost: '350 р', estimatedTime: '1-3 дня' } },
          { id: '6', name: 'Брюки Calvin Klein', price: '10 000 р', size: 'L', image: require('./assets/Vision.png'), delivery: { cost: '350 р', estimatedTime: '1-3 дня' } }
        ],
        total: '30 000 р', 
        date: '08.03.2024' 
      },
    ];

    if (selectedOrder) {
      return renderOrderDetails();
    }

        return (
      <View style={styles.contentContainer}>
        <Animated.View style={styles.backButton} entering={FadeInDown.duration(500).delay(200)}>
          <TouchableOpacity onPress={() => setActiveSection(null)}>
            <BackIcon width={33} height={33} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.ordersContainer}>
          {orders.length === 0 ? (
            <>
              <Text style={styles.emptyStateText}>У вас пока нет заказов</Text>
              <Pressable 
                style={styles.startShoppingButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.startShoppingText}>Начать покупки</Text>
              </Pressable>
            </>
          ) : (
            <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
              {orders.map((order, index) => (
          <Animated.View 
                  key={order.id}
                  entering={FadeInDown.duration(500).delay(300 + index * 50)}
                  style={styles.orderItem}
                >
                  <TouchableOpacity 
                    style={styles.orderBubble}
                    onPress={() => setSelectedOrder(order)}
                  >
                    <Text style={styles.orderNumber}>Заказ №{order.number}</Text>
                  </TouchableOpacity>
                  <Text style={styles.orderSummary}>
                    Итого: {order.total}
                  </Text>
          </Animated.View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    );
  };

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
    <View style={styles.topContent}>
      <Animated.View style={styles.backButtonAlt} entering={FadeInDown.duration(500).delay(200)}>
        <TouchableOpacity onPress={() => setActiveSection(null)}>
          <BackIcon width={33} height={33} />
        </TouchableOpacity>
        <View style={styles.searchContainerAlt}>
          {showThankYou ? (
          <Animated.View 
              entering={FadeInDown.duration(300)}
              exiting={FadeOutDown.duration(300)}
              style={styles.thankYouContainer}
            >
              <Text style={styles.thankYouText}>cпасибо!</Text>
          </Animated.View>
          ) : (
            <TextInput
              style={styles.searchInput}
              placeholder="Ввести бренд"
              placeholderTextColor="rgba(0,0,0,1)"
              value={supportMessage}
              onChangeText={setSupportMessage}
              onSubmitEditing={handleSupportSend}
              returnKeyType="send"
              editable={!isSending}
            />
          )}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(250)} style={{marginTop: 20}}>
        <Text style={styles.sectionTitle}>
          Хотите видеть больше брендов на платформе?
        </Text>
        <Text style={styles.sectionTitle}>
          Напишите и мы постараемся добавить их в скором времени
        </Text>
      </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.supportContainer}>
        <Text style={styles.supportText}>В случае любых вопросов напишите на почту </Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:polka.support@inbox.ru')}>
          <Text style={styles.supportEmail}>polka.support@inbox.ru</Text>
        </TouchableOpacity>
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
    if (selectedOrder) {
      return `ЗАКАЗ №${selectedOrder.number}`;
    }
    
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
  backButtonAlt: {
    width: '100%',
    height: height*0.1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
    lineHeight: 39
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
    paddingHorizontal: 18
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
    height: '100%',
    width: '100%'
  },
  ordersList: {
    marginTop: height*0.05,
    paddingHorizontal: 20,
    borderRadius: 41,
    width: 0.88*width,
    marginBottom: -20
  },
  orderItem: {
    marginBottom: 25,
  },
  orderBubble: {
    backgroundColor: '#E2CCB2',
    borderRadius: 41,
    padding: 20,
    justifyContent: 'center',
    marginBottom: 20,
    height: 0.1*height,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  orderNumber: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  orderSummary: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
    marginLeft: 20,
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
    width: '100%',
    height: height*0.2,
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#E2CCB2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderRadius: 41,
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
  selectedBubblesContainer: {
    width: '100%',
    backgroundColor: '#E2CCB2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderRadius: 41,
    position: 'relative',
    overflow: 'hidden'
  },
  selectedBubblesContent: {
    marginLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  searchContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCBF9D',
    borderRadius: 41,
    paddingHorizontal: 20,
    height: 0.1*height,
    zIndex: 2,
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
  topContent: {
  flex: 1
  },
  searchContainerAlt: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2CCB2',
    borderRadius: 41,
    paddingHorizontal: 20,
    height: 0.1*height,
    marginLeft: 20,
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
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
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
    height: height*0.47,
    backgroundColor: '#E2CCB2',
    borderRadius: 41,
    position: 'relative',
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  brandsList: {
    marginTop: 5,
  },
  brandItem: {
    padding: 20,
  },  
  brandItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  tickContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedItem: {
    opacity: 0.8,
  },
  brandBubbleText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  emptyStateText: {
    fontFamily: 'IgraSans',
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
  orderDetailsContainer: {
    width: '100%',
    paddingTop: height * 0.05,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'space-between'
  },
  orderDetailsTitle: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
    marginBottom: 20,
  },
  orderItemsList: {
    width: width*0.88,
    paddingHorizontal: 20, 
    borderRadius: 41,
    height: '60%'
  },
  cartItem: {
    backgroundColor: '#E2CCB2',
    borderRadius: 41,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    flex: 1,
  },
  itemPressable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingLeft: 25,
    paddingRight: 20,
    paddingBottom: 15,
  },
  itemContent: {
    flexDirection: 'row',
    width: '80%',
    alignItems: 'flex-start',
  },
  imageContainer: {
    width: '30%',
    height: '100%',
    alignSelf: 'flex-start',
    marginRight: 15,
    justifyContent: 'flex-start',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  itemName: {
    fontFamily: 'IgraSans',
    fontSize: 38,
    color: '#000',
    marginBottom: 0,
  },
  itemPrice: {
    fontFamily: 'REM',
    fontSize: 16,
    color: '#000',
    marginBottom: 5,
  },
  itemSize: {
    fontFamily: 'IgraSans',
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  deliveryInfoChangeable: {
    position: 'absolute',
    marginLeft: width * 0.22,
    bottom: 0,
  },
  deliveryText: {
    fontFamily: 'IgraSans',
    fontSize: 14,
    color: '#000',
    marginBottom: 5,
  },
  rightContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '20%',
  },
  circle: {
    position: 'absolute',
    top: '30%',
    bottom: '30%',
    right: 0,
  },
  orderTotalContainer: {
    justifyContent: 'center', 
    alignItems: 'center',
    width: '100%',
    flex: 1
  },
  orderTotalText: {
    fontFamily: 'IgraSans',
    fontSize: 34,
    color: '#000',
  },
  orderStatusContainer: {
    height: height*0.1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#E2CCB2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderRadius: 41
  },
  orderStatus: {
    height: '100%',
    paddingHorizontal: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCBF9D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderRadius: 41
  },
  orderStatusText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  ratingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
  supportText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
    lineHeight: 39
  },
  supportEmail: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
    textDecorationLine: 'underline',
    lineHeight: 39
  },
  thankYouContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  thankYouText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
  },
});

export default Settings; 