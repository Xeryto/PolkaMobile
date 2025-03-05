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

import Cart2 from './assets/Cart2.svg';
import Heart2 from './assets/Heart2.svg';
import HeartFilled from './assets/HeartFilled.svg';
import More from './assets/More.svg';
import Seen from './assets/Seen.svg';

interface CardItem {
  id: number;
  name: string;
  price: string;
  image: any;
}

const MainPage = () => {
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  // Animated values for various interactions
  const pan = useRef(new Animated.ValueXY()).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const buttonsTranslateX = useRef(new Animated.Value(0)).current;
  const sizesTranslateX = useRef(new Animated.Value(-screenWidth)).current;
  const imageHeightPercent = useRef(new Animated.Value(100)).current;

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSizeSelection, setShowSizeSelection] = useState(false);
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

  const swipeCard = (direction: 'up' | 'right' = 'up') => {
    if (isAnimating) return;
    setIsAnimating(true);
    // Animate card moving off screen
    Animated.timing(pan, {
      toValue: { 
        x: direction === 'right' ? screenWidth : 0, 
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
    //animateHeart();
    
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
              onPress={handleLikePress}
            >
              {isLiked ? (
                <HeartFilled width={33} height={33} />
              ) : (
                <Heart2 width={33} height={33} />
              )
              }
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
    }, [showSizeSelection, buttonsTranslateX, sizesTranslateX, imageHeightPercent, fadeAnim, pan, isAnimating, likedCards]);

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
});

export default MainPage; 