import React, { useCallback, useRef, useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  Text, 
  Pressable, 
  Dimensions, 
  Platform, 
  Animated, 
  PanResponder,
  Easing 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import Cart2 from './assets/Cart2.svg';
import Heart2 from './assets/Heart2.svg';
import HeartFilled from './assets/HeartFilled.svg';
import More from './assets/More.svg';
import Seen from './assets/Seen.svg';

// Extend the global namespace to include our cart storage
declare global {
  interface CartItem {
    id: number;
    name: string;
    price: string;
    image: any;
    size: string;
    quantity: number;
    isLiked?: boolean; // Add this line
  }
  
  interface CartStorage {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: number) => void;
    updateQuantity: (id: number, change: number) => void;
    getItems: () => CartItem[];
  }
  
  var cartStorage: CartStorage;
}

// Define a simpler navigation type that our custom navigation can satisfy
interface SimpleNavigation {
  navigate: (screen: string) => void;
  goBack: () => void;
  addListener?: (event: string, callback: () => void) => () => void;
  setParams?: (params: any) => void;
}

interface MainPageProps {
  navigation: SimpleNavigation;
  route?: {
    params?: {
      addCardItem?: CardItem;
    }
  };
}

interface CardItem {
  id: number;
  name: string;
  price: string;
  image: any;
  isLiked?: boolean; // Add liked status to the card itself
}

// Global cards storage that persists even when component unmounts
// This ensures the card collection remains intact when navigating between screens
const persistentCardStorage: {
  cards: CardItem[];
  initialized: boolean;
} = {
  cards: [],
  initialized: false
};

// Simulated API to fetch new card items
const fetchMoreCards = (count: number = 2): Promise<CardItem[]> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Generate unique IDs for new cards (use timestamp and random num)
      const timestamp = new Date().getTime();
      const newCards: CardItem[] = [];
      
      for (let i = 0; i < count; i++) {
        // Create unique ID based on timestamp and index
        const uniqueId = parseInt(`${timestamp}${i}`.slice(-9));
        
        // Randomly determine if the card is already liked (simulating API response)
        // For API cards, 20% chance of being liked
        const isRandomlyLiked = Math.random() < 0.2;
        
        newCards.push({
          id: uniqueId,
          name: `API ITEM ${uniqueId % 1000}`,
          price: `${(Math.random() * 50000).toFixed(0)} р`,
          image: i % 2 === 0 ? 
            require('./assets/Vision.png') : 
            require('./assets/Vision2.png'),
          isLiked: isRandomlyLiked // Set liked status from API
        });
      }
      
      console.log('API - Fetched new cards:', newCards);
      resolve(newCards);
    }, 500); // 500ms delay to simulate network
  });
};

// Simulate API call to like/unlike an item
const simulateLikeApi = (cardId: number, setLiked: boolean): Promise<boolean> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      console.log(`API - ${setLiked ? 'Liking' : 'Unliking'} card ID ${cardId}`);
      
      // In a real app, this would send a request to the server
      // to update the card's like status. Here we update the card directly.
      // We'll do this in the component instead of here
      
      resolve(true);
    }, 300); // 300ms delay to simulate network
  });
};

const MainPage = ({ navigation, route }: MainPageProps) => {
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  // Animated values for various interactions
  const pan = useRef(new Animated.ValueXY()).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const buttonsTranslateX = useRef(new Animated.Value(0)).current;
  const sizesTranslateX = useRef(new Animated.Value(-screenWidth)).current;
  const imageHeightPercent = useRef(new Animated.Value(100)).current;
  
  // Page fade-in animation
  const pageOpacity = useRef(new Animated.Value(0)).current;
  
  // Heart animation value
  const heartScale = useRef(new Animated.Value(1)).current;
  const longPressScale = useRef(new Animated.Value(1)).current;
  
  // Animation controller references to allow cancellation
  const heartAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const longPressAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSizeSelection, setShowSizeSelection] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  // Debounce timer to prevent rapid taps
  const lastTapRef = useRef<number>(0);
  const TAP_DEBOUNCE = 200; // Milliseconds 

  // Initialize with default items but only once
  const [cards, setCards] = useState<CardItem[]>(() => {
    // If we already have cards in our persistent storage, use those
    if (persistentCardStorage.initialized) {
      console.log('MainPage - Using persistent cards:', persistentCardStorage.cards);
      return persistentCardStorage.cards;
    }
    
    // Otherwise initialize with default items
    const defaultCards = [
      { 
        id: 1, 
        name: 'DEFAULT ITEM 1', 
        price: '25 000 р', 
        image: require('./assets/Vision.png'),
        isLiked: false // Default items start unliked
      },
      { 
        id: 2, 
        name: 'DEFAULT ITEM 2', 
        price: '30 000 р', 
        image: require('./assets/Vision2.png'),
        isLiked: false // Default items start unliked
      }
    ];
    
    // Save to persistent storage
    persistentCardStorage.cards = defaultCards;
    persistentCardStorage.initialized = true;
    console.log('MainPage - Initialized persistent cards storage');
    
    return defaultCards;
  });

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];

  // Swipe threshold (how far the card needs to be dragged to trigger a swipe)
  const SWIPE_THRESHOLD = screenHeight * 0.1; // 10% of screen height

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        // Check if drag exceeds threshold
        if (gestureState.dy < -SWIPE_THRESHOLD) {
          // Swipe up
          swipeCard('up');
        } else {
          // Return card to original position
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  const fadeOutIn = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      })
    ]).start();
  }, [fadeAnim]);

  // Clean up any ongoing animations
  const cleanupHeartAnimations = () => {
    if (heartAnimationRef.current) {
      heartAnimationRef.current.stop();
      heartAnimationRef.current = null;
    }
    
    if (longPressAnimationRef.current) {
      longPressAnimationRef.current.stop();
      longPressAnimationRef.current = null;
    }
    
    // Reset animation values to prevent visual glitches
    heartScale.setValue(1);
    longPressScale.setValue(1);
  };

  // Modified heart animation with haptic feedback and API call
  const animateHeart = (currentCardIndex: number) => {
    // Clean up any existing animations
    cleanupHeartAnimations();
    
    const currentCard = cards[currentCardIndex];
    const isCurrentlyLiked = currentCard.isLiked;
    
    // Update the card's liked status
    setCards(prevCards => {
      const newCards = [...prevCards];
      // Toggle like status
      newCards[currentCardIndex] = {
        ...newCards[currentCardIndex],
        isLiked: !isCurrentlyLiked
      };
      
      // Make API call to update like status
      simulateLikeApi(newCards[currentCardIndex].id, !isCurrentlyLiked);
      
      return newCards;
    });
    
    // Provide haptic feedback based on action
    if (isCurrentlyLiked) {
      // Unlike feedback - light impact
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Like feedback - medium impact for Instagram-like feel
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Create and store the animation sequence
    heartAnimationRef.current = Animated.sequence([
      // Quick expand
      Animated.spring(heartScale, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 40,
        bounciness: 12,
        // Use restDisplacementThreshold to end animation more quickly
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01
      }),
      // Return to normal with slight overshoot
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 4
      })
    ]);
    
    // Start the animation
    heartAnimationRef.current.start();
  };

  // Handle long press on heart button
  const handleHeartLongPressIn = () => {
    // Skip if we're in the middle of the debounce period
    const now = Date.now();
    if (now - lastTapRef.current < TAP_DEBOUNCE) return;
    
    setIsLongPressing(true);
    
    // Clean up any existing animations
    cleanupHeartAnimations();
    
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Create and store animation
    longPressAnimationRef.current = Animated.timing(longPressScale, {
      toValue: 1.6,  // Larger expansion for long press
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    });
    
    // Start the animation
    longPressAnimationRef.current.start();
  };
  
  const handleHeartLongPressOut = () => {
    if (isLongPressing) {
      const currentCard = cards[currentCardIndex];
      const isCurrentlyLiked = currentCard.isLiked;
      
      // Update the card's liked status
      setCards(prevCards => {
        const newCards = [...prevCards];
        // Toggle like status
        newCards[currentCardIndex] = {
          ...newCards[currentCardIndex],
          isLiked: !isCurrentlyLiked
        };
        
        // Make API call to update like status
        simulateLikeApi(newCards[currentCardIndex].id, !isCurrentlyLiked);
        
        return newCards;
      });
      
      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Clean up existing animation
      if (longPressAnimationRef.current) {
        longPressAnimationRef.current.stop();
        longPressAnimationRef.current = null;
      }
      
      // Create return to normal animation
      longPressAnimationRef.current = Animated.sequence([
        // Quick bounce
        Animated.spring(longPressScale, {
          toValue: 1.2,
          useNativeDriver: true,
          speed: 40,
          bounciness: 8
        }),
        // Return to normal
        Animated.spring(longPressScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 35,
          bounciness: 2
        })
      ]);
      
      // Start and handle completion
      longPressAnimationRef.current.start(() => {
        setIsLongPressing(false);
        longPressAnimationRef.current = null;
      });
    }
  };

  // Handle heart press (Instagram-style)
  const handleHeartPress = () => {
    // Don't process a tap if we're in long-press mode
    if (isLongPressing) return;
    
    // Debounce rapid taps
    const now = Date.now();
    if (now - lastTapRef.current < TAP_DEBOUNCE) return;
    lastTapRef.current = now;
    
    // Trigger animation with current card index
    animateHeart(currentCardIndex);
  };

  // Clean up animations when component unmounts or changes
  useEffect(() => {
    return () => {
      cleanupHeartAnimations();
    };
  }, []);

  const swipeCard = (direction: 'up' | 'right' = 'up') => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    // Get current card before it's removed
    const currentCard = cards[currentCardIndex];
    
    // Animate card moving off screen
    Animated.timing(pan, {
      toValue: { 
        x: direction === 'right' ? screenWidth : 0, 
        y: -screenHeight 
      },
      duration: 200,
      easing: Easing.ease,
      useNativeDriver: false
    }).start(() => {
      // Remove the current card from the array
      setCards(prevCards => {
        // Create new array without the current card
        const newCards = [...prevCards];
        if (newCards.length > 0) {
          newCards.splice(currentCardIndex, 1);
        }
        
        // Log removed card info
        console.log(`MainPage - Card ${currentCard?.id} was swiped ${direction}`);
        console.log('MainPage - Remaining cards:', newCards.length);
        
        // Reset current index if needed
        const newIndex = currentCardIndex >= newCards.length ? 
          Math.max(0, newCards.length - 1) : 
          currentCardIndex;
        setTimeout(() => setCurrentCardIndex(newIndex), 0);
        
        // Check if we need to fetch more cards
        // Do this inside the state update callback to have access to the new length
        if (newCards.length < 2) {
          console.log('MainPage - Low on cards, fetching more from API');
          fetchMoreCards(1).then(apiCards => {
            // We need to use another setCards call because we can't
            // update the state we're currently setting
            setCards(latestCards => {
              const updatedCards = [...latestCards, ...apiCards];
              console.log('MainPage - Added new cards, total count:', updatedCards.length);
              
              // Update persistent storage
              persistentCardStorage.cards = updatedCards;
              return updatedCards;
            });
          });
        } else {
          // Always update persistent storage
          persistentCardStorage.cards = newCards;
        }
        
        return newCards;
      });
      
      // Reset pan position
      pan.setValue({ x: 0, y: screenHeight });
      
      // Animate card back to original position
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        friction: 6,
        tension: 40,
        useNativeDriver: false
      }).start(() => {
        // Reset animation state
        setIsAnimating(false);
      });
    });

    fadeOutIn();
  };

  const handleCartPress = () => {
    // Animate buttons out and size selection in
    Animated.parallel([
      Animated.timing(buttonsTranslateX, {
        toValue: screenWidth,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      Animated.timing(sizesTranslateX, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      Animated.timing(imageHeightPercent, {
        toValue: 90, // Shrink to 75% height
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false // Must be false for percentage changes
      })
    ]).start(() => {
      setShowSizeSelection(true);
    });
  };

  const handleSizeSelect = (size: string) => {
    // Add the current card with selected size to cart
    const currentCard = cards[currentCardIndex];
    const cartItem = {
      id: currentCard.id,
      name: currentCard.name,
      price: currentCard.price,
      image: currentCard.image,
      size: size,
      quantity: 1,
      isLiked: currentCard.isLiked
    };
    
    // Add item to the cart using global storage (we'll create this shortly)
    // If we already have global cart storage defined, use it
    if (typeof global.cartStorage !== 'undefined') {
      console.log('MainPage - Adding item to cart:', cartItem);
      global.cartStorage.addItem(cartItem);
      
      // Provide haptic feedback on successful add
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      console.log('MainPage - Cart storage not initialized');
    }
    
    // Reset animations and hide size selection
    Animated.parallel([
      Animated.timing(buttonsTranslateX, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      Animated.timing(sizesTranslateX, {
        toValue: -screenWidth,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      Animated.timing(imageHeightPercent, {
        toValue: 100, // Return to original height
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false
      })
    ]).start(() => {
      setShowSizeSelection(false);
      console.log(`Selected size: ${size} for item: ${currentCard.name}`);
    });
  };

  const renderCard = useCallback((card: CardItem) => {
    // Get liked status directly from the card object
    const isLiked = card.isLiked;

    return (
      <Animated.View 
        {...panResponder.panHandlers}
        style={[
          styles.whiteBox, 
          { 
            transform: [
              { translateX: pan.x },
              { translateY: pan.y }
            ] 
          }
        ]}
      >
        <View style={styles.imageHolder}>
          <Animated.View 
          style={{ 
            width: '100%',
            height: imageHeightPercent.interpolate({
              inputRange: [90, 100],
              outputRange: ['90%', '100%']
            }) 
          }}
          >
          <Image 
            key={card.id} // Add key to prevent image flickering
            source={card.image}
            style={styles.image}
            resizeMode="contain"
          />
          </Animated.View>  
          <Pressable style={styles.dotsButton} onPress={() => console.log("pressed")}>
            <More width={23} height={33}/>
          </Pressable>
        </View>

        {/* Buttons Container */}
        <Animated.View 
          style={[
            styles.buttonContainer, 
            { 
              transform: [{ translateX: buttonsTranslateX }],
              opacity: showSizeSelection ? 0 : 1
            }
          ]}
        >
          <Pressable style={styles.button} onPress={handleCartPress}>
            <Cart2 width={33} height={33} />
          </Pressable>
          <Pressable 
            style={styles.button} 
            onPress={() => swipeCard('up')}
          >
            <Seen width={33} height={33} />
          </Pressable>
          <Pressable 
            style={styles.button} 
            onPress={handleHeartPress}
            onLongPress={handleHeartLongPressIn}
            onPressOut={handleHeartLongPressOut}
            delayLongPress={200}
            android_ripple={{ color: 'rgba(0,0,0,0.1)', radius: 20, borderless: true }}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Animated.View style={{ 
              transform: [{ scale: isLongPressing ? longPressScale : heartScale }],
            }}>
              {isLiked ? (
                <HeartFilled width={33} height={33} />
              ) : (
                <Heart2 width={33} height={33} />
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>

        {/* Size Selection Circles */}
        <Animated.View 
          style={[
            styles.sizeContainer, 
            { 
              transform: [{ translateX: sizesTranslateX }],
              opacity: showSizeSelection ? 1 : 0
            }
          ]}
        >
          {sizes.map((size) => (
            <Pressable 
              key={size} 
              style={styles.sizeCircle}
              onPress={() => handleSizeSelect(size)}
            >
              <Text style={styles.sizeText}>{size}</Text>
            </Pressable>
          ))}
        </Animated.View>
      </Animated.View>
    );
  }, [showSizeSelection, buttonsTranslateX, sizesTranslateX, imageHeightPercent, fadeAnim, pan, isAnimating, heartScale, longPressScale, isLongPressing]);

  // Fade in the entire page when component mounts
  useEffect(() => {
    // Start with opacity 0 and fade in
    Animated.timing(pageOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start();
  }, []);

  // Update persistent storage whenever cards change
  useEffect(() => {
    persistentCardStorage.cards = cards;
    console.log('MainPage - Updated persistent storage with cards:', cards);
  }, [cards]);

  // Check if we received a card item to add
  useEffect(() => {
    console.log('MainPage - route params changed:', route?.params);
    
    if (route?.params?.addCardItem) {
      // Get the received item
      const newItem = route.params.addCardItem;
      console.log('MainPage - Received item from Favorites:', newItem);
      
      // For saved items from Favorites or Search, they should be liked by default
      // unless explicitly set
      const isItemLiked = newItem.isLiked !== undefined ? newItem.isLiked : true;
      
      // Generate a unique timestamp to ensure we can add the same item multiple times
      // but still track and remove duplicates if we need to
      const uniqueItem = {
        ...newItem,
        // Make sure isLiked is set properly
        isLiked: isItemLiked,
        // Add a timestamp to the ID to make it unique if needed
        _addedAt: Date.now()
      };
      
      // ALWAYS add the item to the beginning of the array (top of deck)
      // If it exists elsewhere in the array, remove that instance to avoid duplicates
      setCards(prevCards => {
        // Check if the item already exists somewhere in the array
        const existingIndex = prevCards.findIndex(card => card.id === newItem.id);
        console.log('MainPage - Item exists at index:', existingIndex);
        
        let newCards;
        if (existingIndex >= 0) {
          // Item already exists, remove it from its current position
          console.log('MainPage - Removing existing item and adding to top of deck');
          // Filter out the existing item and add the new one at the beginning
          newCards = [
            uniqueItem, 
            ...prevCards.filter(card => card.id !== newItem.id)
          ];
        } else {
          // Item doesn't exist yet, just add it to the beginning
          console.log('MainPage - Adding new item to top of deck');
          newCards = [uniqueItem, ...prevCards];
        }
        
        console.log('MainPage - New cards array:', newCards);
        // Update the persistent storage
        persistentCardStorage.cards = newCards;
        return newCards;
      });
      
      // Always set the current index to 0 to show the newly added/moved item
      setTimeout(() => {
        setCurrentCardIndex(0);
        // Provide feedback
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, 0);
      
      // Important: Clear the param after processing to avoid duplicate adds
      setTimeout(() => {
        console.log('MainPage - Clearing addCardItem parameter');
        if (navigation.setParams) {
          navigation.setParams({ addCardItem: undefined });
        }
      }, 100);
    }
  }, [route?.params]); // Only dependent on route params now

  return (
    <Animated.View style={[styles.container, { opacity: pageOpacity }]}>
      <View style={styles.roundedBox}>
        <LinearGradient
          colors={["rgba(205, 166, 122, 0.4)", "rgba(205, 166, 122, 0)"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0.3 }}
          style={styles.gradientBackground}
        />
        
        {/* Render current card or show empty state */}
        {cards.length > 0 ? (
          renderCard(cards[currentCardIndex])
        ) : (
          <View style={styles.noCardsContainer}>
            <Text style={styles.noCardsText}>No cards available</Text>
            <Text style={styles.noCardsSubtext}>Loading new cards...</Text>
          </View>
        )}

        {cards.length > 0 && (
          <Animated.View style={[styles.text, { opacity: fadeAnim }]}>
            <Text style={styles.name} numberOfLines={1}>
              {cards[currentCardIndex]?.name || 'No Name'}
            </Text>
            <Text style={styles.price}>
              {cards[currentCardIndex]?.price || '0 р'}
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    //paddingBottom: '12%', // To prevent overlap with the navbar
  },
  gradientBackground: {
    borderRadius: 37,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  roundedBox: {
    width: '88%',
    height: '90%',
    borderRadius: 41,
    backgroundColor: 'rgba(205, 166, 122, 0)', // #CDA67A with 40% opacity
    position: 'relative',
    //justifyContent: 'center',
    //alignItems: 'center',
    //overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(205, 166, 122, 0.4)',
  },
  whiteBox: {
    width: '102%',
    height: '82%',
    borderRadius: 41,
    backgroundColor: '#F2ECE7', // White background
    position: 'absolute',
    top: -3,
    left: -3,
    // Shadow properties
    shadowColor: '#000', // Shadow color
    shadowOffset: {
      width: 0.25,
      height: 4, // Vertical offset
    },
    shadowOpacity: 0.5, // Shadow opacity
    shadowRadius: 4, // Shadow blur
    elevation: 10, // For Android shadow
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
  overlayLabelContainer: {
    width: '102%',
    height: '82%',
    borderRadius: 41,
    top: -3,
    left: -3,
    justifyContent: 'center', 
    alignItems:'center'
  },
  imageHolder: {
    width: '75%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5, // Space between image and buttons
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  dotsButton: {
    position: 'absolute',
    top: -15, // Adjust as needed
    right: -22.5, // Adjust as needed
    padding: 5,
    //backgroundColor: 'rgba(255, 255, 255, 0.7)', // Semi-transparent background
    borderRadius: 5,
  },
  dotsImage: {
    width: 23, // Adjust size as needed
    height: 33, // Adjust size as needed
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '110%',
    marginBottom: -40,
    //paddingBottom: 0, // Padding for the buttons
  },
  button: {
    padding: 5,
    //backgroundColor: '#E0E0E0', // Button background color
    //borderRadius: 5,
  },
  icon: {
    width: 33,
    height: 33,
    resizeMode: 'contain', // Ensure the image scales properly
  },
  text: {
    top: Platform.OS == 'android' ? '82.5%' : '85%',
    width: "100%",
    paddingLeft: 22
  },
  name: {
    fontFamily: 'IgraSans', // Use the Igra Sans font
    fontSize: 38,
    textAlign: 'left',
    color: 'white',
    //marginVertical: 5, // Space around the name
  },
  price: {
    fontFamily: 'REM', // Use the REM font
    fontSize: 16,
    textAlign: 'left',
    color: 'white',
    //marginBottom: 10, // Space below the price
  },
  sizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: -20,
  },
  sizeCircle: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
    backgroundColor: '#E2CCB2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sizeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noCardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCardsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  noCardsSubtext: {
    fontSize: 16,
    color: 'white',
  },
});

export default MainPage; 