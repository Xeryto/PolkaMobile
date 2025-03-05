import React, { useCallback, useRef, useState } from 'react';
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

interface CardItem {
  id: number;
  name: string;
  price: string;
  image: any;
}

const Cart = () => {
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  // Animated values for various interactions
  const pan = useRef(new Animated.ValueXY()).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const buttonsTranslateX = useRef(new Animated.Value(0)).current;
  const sizesTranslateX = useRef(new Animated.Value(-screenWidth)).current;
  const imageHeightPercent = useRef(new Animated.Value(100)).current;
  
  // Heart animation value
  const heartScale = useRef(new Animated.Value(1)).current;

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showSizeSelection, setShowSizeSelection] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [likedCards, setLikedCards] = useState<number[]>([]);

  const [cards, setCards] = useState<CardItem[]>([
    { 
      id: 1, 
      name: 'NAME', 
      price: '25 000 р', 
      image: require('./assets/Vision.png') 
    },
    { 
      id: 2, 
      name: 'ANOTHER NAME', 
      price: '30 000 р', 
      image: require('./assets/Vision2.png') 
    },
    { 
      id: 3, 
      name: 'NAME', 
      price: '25 000 р', 
      image: require('./assets/Vision.png') 
    },
  ]);

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];

  // Swipe threshold (how far the card needs to be dragged to trigger a swipe)
  const SWIPE_THRESHOLD = screenHeight * 0.2; // 20% of screen height

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !isAnimating,
      onPanResponderMove: Animated.event(
        [null, { dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        // Prevent multiple swipes during animation
        if (isAnimating) return;

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

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.5, // Scale up
        duration: 100,
        useNativeDriver: true,
        easing: Easing.elastic(3)
      }),
      Animated.timing(heartScale, {
        toValue: 1, // Return to original size
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bounce
      })
    ]).start();
  };

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

  const swipeCard = (direction: 'up' = 'up') => {
    // Prevent multiple swipes
    if (isAnimating) return;
    setIsAnimating(true);

    // Animate card moving off screen
    Animated.timing(pan, {
      toValue: { 
        x: 0, 
        y: -screenHeight 
      },
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: false
    }).start(() => {
      // Move to next card or reset if at the end
      setCurrentCardIndex(prevIndex => 
        prevIndex + 1 < cards.length ? prevIndex + 1 : 0
      );
      
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

  const handleLikePress = () => {
    const currentCardId = cards[currentCardIndex].id;
    
    // Animate heart
    animateHeart();
    
    // Toggle like status
    setLikedCards(prevLiked => 
      prevLiked.includes(currentCardId)
        ? prevLiked.filter(id => id !== currentCardId)
        : [...prevLiked, currentCardId]
    );
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
      console.log(`Selected size: ${size}`);
    });
  };

  const renderCard = useCallback((card: CardItem) => {
    const isLiked = likedCards.includes(card.id);

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
          style={
            { 
              width: '100%',
              height: imageHeightPercent.interpolate({
                inputRange: [90, 100],
                outputRange: ['90%', '100%']
              }) 
            }
            }
          >
          <Image 
            key={card.id} // Add key to prevent image flickering
            source={card.image}
            style={styles.image}
            resizeMode="contain"
          />
          </Animated.View>  
          <Pressable style={styles.dotsButton} onPress={() => console.log("pressed")}>
            <Image 
              source={require('./assets/More.png')}
              style={styles.dotsImage}
            />
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
            <Image 
              source={require('./assets/Cart2.png')}
              style={styles.icon}
            />
          </Pressable>
          <Pressable 
            style={styles.button} 
            onPress={() => swipeCard('up')}
          >
            <Image 
              source={require('./assets/Seen.png')}
              style={styles.icon}
            />
          </Pressable>
          <Pressable 
            style={styles.button} 
            onPress={handleLikePress}
          >
            <Animated.Image 
              source={
                isLiked 
                  ? require('./assets/HeartFilled.png') 
                  : require('./assets/Heart2.png')
              }
              style={[
                styles.icon,
                { 
                  transform: [{ 
                    scale: heartScale 
                  }]
                }
              ]}
            />
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
  }, [showSizeSelection, buttonsTranslateX, sizesTranslateX, imageHeightPercent, fadeAnim, pan, isAnimating, likedCards, heartScale]);

  return (
    <View style={styles.container}>
      <View style={styles.roundedBox}>
        <LinearGradient
          colors={["rgba(205, 166, 122, 0.4)", "rgba(205, 166, 122, 0)"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0.3 }}
          style={styles.gradientBackground}
        />
        
        {/* Render current card */}
        {renderCard(cards[currentCardIndex])}

        <Animated.View style={[styles.text, { opacity: fadeAnim }]}>
          <Text style={styles.name}>
            {cards[currentCardIndex]?.name || 'No Name'}
          </Text>
          <Text style={styles.price}>
            {cards[currentCardIndex]?.price || '0 р'}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: 'rgba(205, 166, 122, 0)', 
    position: 'relative',
    borderWidth: 3,
    borderColor: 'rgba(205, 166, 122, 0.4)',
  },
  whiteBox: {
    width: '102%',
    height: '82%',
    borderRadius: 41,
    backgroundColor: '#F2ECE7', 
    position: 'absolute',
    top: -3,
    left: -3,
    shadowColor: '#000', 
    shadowOffset: {
      width: 0.25,
      height: 4, 
    },
    shadowOpacity: 0.5, 
    shadowRadius: 4, 
    elevation: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  imageHolder: {
    width: '75%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5, 
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  dotsButton: {
    position: 'absolute',
    top: -15, 
    right: -15, 
    padding: 5,
    borderRadius: 5,
  },
  dotsImage: {
    width: 23, 
    height: 33, 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '110%',
    marginBottom: -40,
  },
  button: {
    padding: 5,
  },
  icon: {
    width: 33,
    height: 33,
    resizeMode: 'contain', 
  },
  text: {
    top: Platform.OS == 'android' ? '82.5%' : '85%',
    width: "100%",
    paddingLeft: 22
  },
  name: {
    fontFamily: 'IgraSans', 
    fontSize: 38,
    textAlign: 'left',
    color: 'white',
  },
  price: {
    fontFamily: 'REM', 
    fontSize: 16,
    textAlign: 'left',
    color: 'white',
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
});

export default Cart;