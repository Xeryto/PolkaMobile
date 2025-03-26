import React, { useCallback, useRef, useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  Text, 
  Pressable, 
  Dimensions, 
  Platform, 
  Animated as RNAnimated, 
  PanResponder,
  Easing 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

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
    cartItemId?: string; // Add cartItemId
  }
  
  interface CartStorage {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, change: number) => void;
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
      refreshCards?: boolean;
      refreshTimestamp?: number;
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

// Add this after imports and before MainPage component
// Dedicated Heart Button component to improve like/unlike functionality
interface HeartButtonProps {
  isLiked: boolean;
  onToggleLike: () => void;
}

const HeartButton: React.FC<HeartButtonProps> = ({ isLiked, onToggleLike }) => {
  // Local animation state
  const heartScale = useRef(new RNAnimated.Value(1)).current;
  const pressScale = useRef(new RNAnimated.Value(1)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Track internal version of isLiked for debugging
  const [internalIsLiked, setInternalIsLiked] = useState(isLiked);
  
  // Debug log props changes
  useEffect(() => {
    console.log(`HeartButton - Props changed: isLiked=${isLiked}`);
    setInternalIsLiked(isLiked);
  }, [isLiked]);
  
  // Handle heart button press-in animation
  const handlePressIn = () => {
    RNAnimated.timing(pressScale, {
      toValue: 0.85,
      duration: 80,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start();
  };
  
  // Handle heart button press-out animation
  const handlePressOut = () => {
    RNAnimated.timing(pressScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start();
    
    // Call the actual press handler
    handlePress();
  };
  
  // Handle heart button press
  const handlePress = () => {
    // Log press event for debugging
    console.log(`HeartButton - Button pressed: current isLiked=${isLiked}`);
    
    // Prevent double-taps during animation
    if (isAnimating) {
      console.log('HeartButton - Ignoring press during animation');
      return;
    }
    
    // Set animating flag
    setIsAnimating(true);
    
    // Trigger the callback to toggle like state
    onToggleLike();
    
    // Update our internal state for debugging visibility
    setInternalIsLiked(!internalIsLiked);
    
    // Provide haptic feedback
    Haptics.impactAsync(
      isLiked 
        ? Haptics.ImpactFeedbackStyle.Light  // Feedback for unliking
        : Haptics.ImpactFeedbackStyle.Medium // Feedback for liking
    );
    
    // Animate the heart
    RNAnimated.sequence([
      // Scale up
      RNAnimated.spring(heartScale, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 300,
        bounciness: 12,
      }),
      // Scale back down
      RNAnimated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 300,
        bounciness: 12,
      })
    ]).start(() => {
      // Clear animation flag when complete
      setIsAnimating(false);
      console.log('HeartButton - Animation completed');
    });
  };
  
  return (
    <Pressable 
      style={[styles.button, { zIndex: 10 }]} // Added zIndex to ensure button is clickable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: 'rgba(0,0,0,0.1)', radius: 20, borderless: true }}
      hitSlop={{ top: 25, bottom: 25, left: 25, right: 25 }}
    >
      <RNAnimated.View style={{ transform: [{ scale: pressScale }] }}>
        <RNAnimated.View style={{ transform: [{ scale: heartScale }] }}>
          {isLiked ? (
            <HeartFilled width={33} height={33} />
          ) : (
            <Heart2 width={33} height={33} />
          )}
        </RNAnimated.View>
      </RNAnimated.View>
    </Pressable>
  );
};

const MainPage = ({ navigation, route }: MainPageProps) => {
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  // RNAnimated values for various interactions
  const pan = useRef(new RNAnimated.ValueXY()).current;
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;
  const buttonsTranslateX = useRef(new RNAnimated.Value(0)).current;
  const sizesTranslateX = useRef(new RNAnimated.Value(-screenWidth)).current;
  const imageHeightPercent = useRef(new RNAnimated.Value(100)).current;
  
  // Page fade-in animation
  const pageOpacity = useRef(new RNAnimated.Value(1)).current;
  
  // Add refresh animation state
  const refreshAnim = useRef(new RNAnimated.Value(1)).current;
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Heart animation value
  const heartScale = useRef(new RNAnimated.Value(1)).current;
  const longPressScale = useRef(new RNAnimated.Value(1)).current;
  
  // Animation controller references to allow cancellation
  const heartAnimationRef = useRef<RNAnimated.CompositeAnimation | null>(null);
  const longPressAnimationRef = useRef<RNAnimated.CompositeAnimation | null>(null);
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSizeSelection, setShowSizeSelection] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Animation state for buttons
  const cartButtonScale = useRef(new RNAnimated.Value(1)).current;
  const seenButtonScale = useRef(new RNAnimated.Value(1)).current;
  
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

  // Add a text fade animation function
  const animateTextChange = () => {
    // First fade out
    RNAnimated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease)
    }).start(() => {
      // Then fade back in
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      }).start();
    });
  };

  // Add an effect to animate text changes when the current card index changes
  useEffect(() => {
    if (cards.length > 0) {
      animateTextChange();
    }
  }, [currentCardIndex]);
  
  // Enhance the panResponder to be even more robust
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only allow swiping if not already in an animation and not refreshing
        return !isAnimating && !isRefreshing && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow upward movement (negative dy values)
        if (gestureState.dy <= 0) {
          // Directly set the Y value instead of using event
          pan.setValue({ x: 0, y: gestureState.dy });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If already animating or refreshing, just reset position
        if (isAnimating || isRefreshing) {
          RNAnimated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false
          }).start();
          return;
        }

        // Check if drag exceeds threshold
        if (gestureState.dy < -SWIPE_THRESHOLD) {
          // Swipe up
          swipeCard('up');
        } else {
          // Return card to original position
          RNAnimated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // If the gesture is terminated for any reason, reset position
        RNAnimated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 5,
          useNativeDriver: false
        }).start();
      }
    })
  ).current;

  const fadeOutIn = useCallback(() => {
    // Cancel any ongoing fade animations first
    fadeAnim.stopAnimation();
    
    // Reset the opacity to ensure we start from a known state
    fadeAnim.setValue(1);
    
    // Use sequence for more reliable animation
    RNAnimated.sequence([
      RNAnimated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      RNAnimated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      })
    ]).start((finished) => {
      // If the animation was interrupted, ensure we end with full opacity
      if (!finished.finished) {
        fadeAnim.setValue(1);
      }
    });
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

  // Toggle like status directly with proper boolean handling
  const toggleLike = useCallback((index: number) => {
    console.log(`toggleLike - Called with index: ${index}`);
    
    if (index < 0 || index >= cards.length) {
      console.log(`toggleLike - Invalid index: ${index}, cards length: ${cards.length}`);
      return;
    }
    
    const card = cards[index];
    const currentLikedStatus = card.isLiked === true;
    const newLikedStatus = !currentLikedStatus;
    
    console.log(`toggleLike - Card ${card.id} toggling from ${currentLikedStatus} to ${newLikedStatus}`);
    
    // Create a completely new array to ensure state change is detected
    const newCards = [...cards];
    newCards[index] = {
      ...card,
      isLiked: newLikedStatus
    };
    
    // Log before and after
    console.log(`toggleLike - Before update: ${cards[index].isLiked}, After update will be: ${newCards[index].isLiked}`);
    
    // Update state with new array
    setCards(newCards);
    
    // Update persistent storage
    persistentCardStorage.cards = newCards;
    
    // Simulate API call
    simulateLikeApi(card.id, newLikedStatus);
    
    console.log(`toggleLike - Updated card ${card.id} like status to: ${newLikedStatus}`);
  }, [cards]);
  
  const handleLongPress = useCallback((index: number) => {
    console.log(`handleLongPress - Long press on card ${index}`);
    if (index < 0 || index >= cards.length) return;
    
    // Toggle the like status
    toggleLike(index);
    
    // Provide haptic feedback,
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [cards, toggleLike]);

  // Clean up animations when component unmounts or changes
  useEffect(() => {
    return () => {
      cleanupHeartAnimations();
    };
  }, []);

  const swipeCard = (direction: 'up' | 'right' = 'up') => {
    if (isAnimating) return;
    
    // Add cushioning - prevent swiping the last card until more are loaded
    if (cards.length <= 1) {
      console.log('MainPage - Preventing swipe of last card until more are loaded');
      
      // Show a quick bounce animation to indicate swipe is not allowed
      RNAnimated.sequence([
        RNAnimated.timing(pan, {
          toValue: { x: 0, y: -50 },
          duration: 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false
        }),
        RNAnimated.spring(pan, {
          toValue: { x: 0, y: 0 },
          friction: 4,
          tension: 40,
          useNativeDriver: false
        })
      ]).start();
      
      // Trigger card refresh instead of swiping
      if (!isRefreshing) {
        refreshCards();
      }
      
      // Provide haptic feedback to indicate action is restricted
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      return;
    }
    
    setIsAnimating(true);
    
    // Get current card before it's removed
    const currentCard = cards[currentCardIndex];
    
    // Set a timeout that will reset animation state if something goes wrong
    const animationSafetyTimeout = setTimeout(() => {
      console.log('MainPage - Animation safety timeout triggered');
      setIsAnimating(false);
      pan.setValue({ x: 0, y: 0 });
    }, 2000); // 2 seconds is enough time for the animation to complete
    
    // Animate card moving off screen
    RNAnimated.timing(pan, {
      toValue: { 
        x: direction === 'right' ? screenWidth : 0, 
        y: -screenHeight 
      },
      duration: 100,
      easing: Easing.ease,
      useNativeDriver: false
    }).start(() => {
      // Clear the safety timeout since animation completed
      clearTimeout(animationSafetyTimeout);
      
      // Remove the current card from the array
      setCards(prevCards => {
        // If no cards left, just return empty array
        if (prevCards.length === 0) {
          return [];
        }
        
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
        
        // Check if we need to fetch more cards - start fetching earlier when getting low
        if (newCards.length < 3) {
          console.log('MainPage - Low on cards, fetching more from API');
          fetchMoreCards(2).then(apiCards => {
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
      RNAnimated.spring(pan, {
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

  // Handle cart button press-in animation
  const handleCartPressIn = () => {
    RNAnimated.timing(cartButtonScale, {
      toValue: 0.85,
      duration: 80,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start();
  };
  
  // Handle cart button press-out animation
  const handleCartPressOut = () => {
    RNAnimated.timing(cartButtonScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start();
    
    // Call the actual press handler
    handleCartPress();
  };
  
  // Handle seen button press-in animation
  const handleSeenPressIn = () => {
    RNAnimated.timing(seenButtonScale, {
      toValue: 0.85,
      duration: 80,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start();
  };
  
  // Handle seen button press-out animation
  const handleSeenPressOut = () => {
    RNAnimated.timing(seenButtonScale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start();
    
    // Call the actual press handler
    swipeCard('up');
  };

  const handleCartPress = () => {
    // Animate buttons out and size selection in
    RNAnimated.parallel([
      RNAnimated.timing(buttonsTranslateX, {
        toValue: screenWidth,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      RNAnimated.timing(sizesTranslateX, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      RNAnimated.timing(imageHeightPercent, {
        toValue: 90, // Shrink to 75% height
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false // Must be false for percentage changes
      })
    ]).start(() => {
      setShowSizeSelection(true);
    });
  };

  // Function to reset UI from size selection back to buttons
  const resetToButtons = () => {
    // Reset animations and hide size selection
    RNAnimated.parallel([
      RNAnimated.timing(buttonsTranslateX, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      RNAnimated.timing(sizesTranslateX, {
        toValue: -screenWidth,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true
      }),
      RNAnimated.timing(imageHeightPercent, {
        toValue: 100, // Return to original height
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: false
      })
    ]).start(() => {
      setShowSizeSelection(false);
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
      quantity: 1,  // Always set to 1
      isLiked: currentCard.isLiked
    };
    
    // Add item to the cart using global storage
    if (typeof global.cartStorage !== 'undefined') {
      console.log('MainPage - Adding item to cart:', cartItem);
      global.cartStorage.addItem(cartItem);
      
      // Provide haptic feedback on successful add
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Display selected size as feedback
      console.log('Selected size:', size, 'for item:', currentCard.name);
      
      // Reset UI to show buttons again
      resetToButtons();
      
      // Navigate to cart after adding
      console.log('MainPage - Navigating to Cart screen after adding item');
      navigation.navigate('Cart');
    } else {
      console.log('MainPage - Cart storage not initialized');
    }
  };

  // Enhance the renderEmptyState function to include text placeholders
  const renderEmptyState = () => {
    return (
      <View style={[styles.whiteBox, styles.noCardsContainer]}>
        <Text style={styles.noCardsText}>Loading new cards...</Text>
        <Text style={styles.noCardsSubtext}>Please wait a moment</Text>
      </View>
    );
  };

  // Add a safeguard effect to ensure currentCardIndex stays valid
  useEffect(() => {
    // If currentCardIndex is out of bounds and there are cards available, reset it
    if (currentCardIndex >= cards.length && cards.length > 0) {
      console.log('MainPage - Fixing out of bounds currentCardIndex');
      setCurrentCardIndex(0);
    }
  }, [cards, currentCardIndex]);

  // Adjust the renderCard function to add safeguards
  const renderCard = useCallback((card: CardItem, index: number) => {
    // Safety check - if card is undefined, don't render
    if (!card) {
      console.log('MainPage - Card is undefined, cannot render');
      return renderEmptyState();
    }

    // Get liked status directly from the card object and ensure it's a boolean
    const isLiked = card.isLiked === true;
    
    console.log(`renderCard - Rendering card ${card.id} at index ${index}, isLiked: ${isLiked}`);

    return (
      <RNAnimated.View 
        {...panResponder.panHandlers}
        style={[
          styles.whiteBox, 
          { 
            transform: [
              { translateX: pan.x },
              { translateY: pan.y }
            ],
            opacity: refreshAnim // Apply refresh animation opacity directly to the white box
          }
        ]}
      >
        <View style={styles.imageHolder}>
          <RNAnimated.View 
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
          </RNAnimated.View>  
          <Pressable style={styles.dotsButton} onPress={() => console.log("pressed")}>
            <More width={23} height={33}/>
          </Pressable>
        </View>

        {/* Buttons Container */}
        <RNAnimated.View 
          style={[
            styles.buttonContainer, 
            { 
              transform: [{ translateX: buttonsTranslateX }],
              opacity: showSizeSelection ? 0 : 1
            }
          ]}
        >
          <Pressable 
            style={styles.button} 
            onPressIn={handleCartPressIn}
            onPressOut={handleCartPressOut}
          >
            <RNAnimated.View style={{ transform: [{ scale: cartButtonScale }] }}>
              <Cart2 width={33} height={33} />
            </RNAnimated.View>
          </Pressable>
          
          <Pressable 
            style={styles.button}
            onPressIn={handleSeenPressIn}
            onPressOut={handleSeenPressOut}
          >
            <RNAnimated.View style={{ transform: [{ scale: seenButtonScale }] }}>
              <Seen width={33} height={33} />
            </RNAnimated.View>
          </Pressable>
          
          {/* Use HeartButton with explicit index */}
          <View style={{ zIndex: 999 }}>
            <HeartButton 
              isLiked={isLiked} 
              onToggleLike={() => toggleLike(index)} 
            />
          </View>
          
          {/* Add long press overlay for the heart */}
          <Pressable 
            style={[
              styles.longPressOverlay, 
              { position: 'absolute', right: 0, zIndex: 998 }
            ]}
            onLongPress={() => handleLongPress(index)}
            delayLongPress={300}
          />
        </RNAnimated.View>

        {/* Size Selection Circles */}
        <RNAnimated.View 
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
        </RNAnimated.View>
      </RNAnimated.View>
    );
  }, [
    showSizeSelection, 
    buttonsTranslateX, 
    sizesTranslateX, 
    imageHeightPercent, 
    pan, 
    swipeCard, 
    handleLongPress, 
    toggleLike,
    refreshAnim,
    renderEmptyState // Add the new dependency
  ]);

  // Function to refresh cards with a subtle animation
  const refreshCards = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple refreshes at once
    
    console.log('MainPage - Refreshing recommended cards');
    setIsRefreshing(true);
    
    // Play a subtle fade animation
    RNAnimated.sequence([
      // Fade out slightly
      RNAnimated.timing(refreshAnim, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease)
      }),
      // Fade back in
      RNAnimated.timing(refreshAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
        easing: Easing.inOut(Easing.ease)
      })
    ]).start();
    
    try {
      // Fetch new cards from "API"
      const newCards = await fetchMoreCards(2);
      
      // Wait for a short moment to make the refresh feel more natural
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Update cards with the new ones at the beginning
      setCards(prevCards => {
        const updatedCards = [...newCards, ...prevCards.slice(0, 3)];
        console.log('MainPage - Cards refreshed, new count:', updatedCards.length);
        
        // Update persistent storage
        persistentCardStorage.cards = updatedCards;
        return updatedCards;
      });
      
      // Reset current card index to show the first new card
      setCurrentCardIndex(0);
      
      // Provide haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error refreshing cards:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);
  
  // Listen for refresh signal from navigation params
  useEffect(() => {
    if (route?.params?.refreshCards && route?.params?.refreshTimestamp) {
      refreshCards();
      
      // Clear the refresh params after processing
      setTimeout(() => {
        if (navigation.setParams) {
          navigation.setParams({ 
            refreshCards: undefined,
            refreshTimestamp: undefined
          });
        }
      }, 100);
    }
  }, [route?.params?.refreshTimestamp, refreshCards, navigation]);

  // Fade in the entire page when component mounts
  useEffect(() => {
    // Start with opacity 0 and fade in to 1
    pageOpacity.setValue(0);
    RNAnimated.timing(pageOpacity, {
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
      
      // Check if isLiked property is explicitly defined
      // If it's not defined, we'll use false as the default now instead of true
      const isItemLiked = newItem.isLiked !== undefined ? newItem.isLiked : false;
      
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

  // Add a constant for the minimum number of cards to maintain
  const MIN_CARDS_THRESHOLD = 3;

  // Enhance the useEffect hook that checks for empty cards to be more proactive
  useEffect(() => {
    // Load cards if the persistent storage is getting low
    if (cards.length < MIN_CARDS_THRESHOLD && !isRefreshing) {
      console.log(`MainPage - Cards running low (${cards.length}), preemptively fetching more`);
      
      // Set a small delay to prevent multiple fetch requests
      const fetchTimer = setTimeout(() => {
        fetchMoreCards(MIN_CARDS_THRESHOLD - cards.length + 1).then(apiCards => {
          if (apiCards.length > 0) {
            setCards(prevCards => {
              // Avoid duplicate fetching by checking if cards were already added
              if (prevCards.length >= MIN_CARDS_THRESHOLD) {
                return prevCards;
              }
              
              const updatedCards = [...prevCards, ...apiCards];
              console.log('MainPage - Added new cards, total count:', updatedCards.length);
              
              // Update persistent storage
              persistentCardStorage.cards = updatedCards;
              
              // Reset animation state just in case
              setIsAnimating(false);
              pan.setValue({ x: 0, y: 0 });
              
              return updatedCards;
            });
          }
        }).catch(error => {
          console.error('Error fetching cards:', error);
          // Reset animation state on error
          setIsAnimating(false);
          pan.setValue({ x: 0, y: 0 });
        });
      }, 300);
      
      return () => clearTimeout(fetchTimer);
    }
  }, [cards.length, isRefreshing]);

  return (
    <RNAnimated.View style={{ opacity: pageOpacity, width: '100%', height: '100%' }}>
      <Animated.View 
        style={[styles.container]}
        entering={FadeInDown.duration(500).delay(200)} 
        exiting={FadeOutDown.duration(50)}
      >
        <View style={styles.roundedBox}>
          <LinearGradient
            colors={["rgba(205, 166, 122, 0.5)", "transparent"]}
            start={{ x: 0.1, y: 1 }}
            end={{ x: 0.9, y: 0.3 }}
            locations={[0.2, 1]}
            style={styles.gradientBackground}
          />
          
          {/* Always show something, even during transitions */}
          {isAnimating && cards.length === 0 ? (
            renderEmptyState()
          ) : cards.length > 0 ? (
            renderCard(cards[currentCardIndex], currentCardIndex)
          ) : (
            renderEmptyState()
          )}

          {/* Always show text, with placeholder if no cards */}
          <RNAnimated.View style={{ opacity: refreshAnim, width: '100%', height: '100%' }}>
          <RNAnimated.View style={[styles.text, { opacity: fadeAnim}]}>
            {cards.length > 0 ? (
              <>
                <Text style={styles.name} numberOfLines={1}>
                  {cards[currentCardIndex]?.name || 'No Name'}
                </Text>
                <Text style={styles.price}>
                  {cards[currentCardIndex]?.price || '0 р'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.name} numberOfLines={1}>
                  Loading...
                </Text>
                <Text style={styles.price}>
                  Please wait
                </Text>
              </>
            )}
          </RNAnimated.View>
          </RNAnimated.View>
        </View>
      </Animated.View>
    </RNAnimated.View>
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
    zIndex: 900,
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
    zIndex: 1000-7,
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
    paddingHorizontal: 18
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
  longPressOverlay: {
    width: 50,
    height: 50,
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 998,
  },
});

export default MainPage; 