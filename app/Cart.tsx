import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, SafeAreaView, Dimensions, Easing, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Cancel from './assets/Cancel.svg';
import { RoundedRect, Shadow, Canvas } from '@shopify/react-native-skia';

const { height, width } = Dimensions.get('window');

// Define a simpler navigation type that our custom navigation can satisfy
interface SimpleNavigation {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface CartProps {
  navigation: SimpleNavigation;
}

// Interface for delivery information
interface DeliveryInfo {
  cost: string;
  estimatedTime: string;
}

// Update the CartItem interface to ensure delivery is required
interface CartItem {
  id: number;
  name: string;
  price: string;
  size: string;
  image: any;
  quantity: number;
  isLiked?: boolean;
  delivery: DeliveryInfo; // Required field, not optional
  cartItemId?: string; // Add optional cartItemId field
}

// Simulate API call to get delivery information for an item
const getItemDeliveryInfo = (itemId: number, quantity: number): Promise<DeliveryInfo> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // In a real app, this would be calculated based on item, quantity, user location, etc.
      // Here we create some variety in delivery times and costs
      let cost = '350 р';
      let time = '1-3 дня';
      
      // Randomize delivery times and costs a bit based on itemId
      if (itemId % 3 === 0) {
        cost = '250 р';
        time = '2-4 дня';
      } else if (itemId % 2 === 0) {
        cost = '400 р';
        time = '1 день';
      }
      
      // Adjust cost for multiple items
      if (quantity > 1) {
        const baseCost = parseInt(cost.replace(/\D/g, ''));
        const adjustedCost = Math.round(baseCost * (1 + (quantity - 1) * 0.1)); // 10% increase per additional item
        cost = `${adjustedCost} р`;
      }
      
      resolve({
        cost,
        estimatedTime: time
      });
    }, 200); // 200ms delay to simulate network
  });
};

// Cancel Button Component with animation
interface CancelButtonProps {
  onRemove: (cartItemId: string) => void;
  cartItemId: string;
}

const CancelButton: React.FC<CancelButtonProps> = ({ onRemove, cartItemId }) => {
  const scale = useRef(new RNAnimated.Value(1)).current;
  
  const handlePressIn = () => {
    RNAnimated.timing(scale, {
      toValue: 0.85,
      duration: 80,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start();
  };
  
  const handlePressOut = () => {
    RNAnimated.timing(scale, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease)
    }).start();
    
    // Call the actual press handler
    onRemove(cartItemId);
  };
  
  return (
  <RNAnimated.View style={[{ transform: [{ scale }] }, styles.removeButton]}>
    <Pressable 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      
        <Cancel width={27} height={27} />
      
    </Pressable>
    </RNAnimated.View>
  );
};

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

const Cart = ({ navigation }: CartProps) => {
  // Use state to ensure UI updates when cart changes
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get screen dimensions for responsive layout
  const { width } = Dimensions.get('window');
  const itemWidth = width * 0.8;
  
  // Load cart items and delivery info on mount and when component gains focus
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load the cart items
      if (global.cartStorage) {
        const items = [...global.cartStorage.getItems()];
        
        // Add delivery info to each item
        const itemsWithDelivery = await Promise.all(
          items.map(async (item) => {
            try {
              // Always fetch delivery info for each item
              const delivery = await getItemDeliveryInfo(item.id, item.quantity);
              return { 
                ...item, 
                delivery,
                cartItemId: item.cartItemId || `${item.id}-${item.size}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
              } as CartItem; // Explicitly type as CartItem
            } catch (error) {
              console.error(`Error fetching delivery info for item ${item.id}:`, error);
              // Provide default delivery info in case of error
              return { 
                ...item, 
                delivery: { 
                  cost: '350 р', 
                  estimatedTime: '1-3 дня' 
                },
                cartItemId: item.cartItemId || `${item.id}-${item.size}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
              } as CartItem; // Explicitly type as CartItem
            }
          })
        );
        
        setCartItems(itemsWithDelivery);
      }
      
      setIsLoading(false);
    };
    
    loadData();
    
    // Set up an interval to refresh cart items (simulates realtime updates)
    const intervalId = setInterval(() => {
      if (global.cartStorage) {
        const items = [...global.cartStorage.getItems()];
        
        // Only update if there are actual changes to avoid infinite loops
        setCartItems(prevItems => {
          // Check if the cart contents have changed (different items or quantities)
          const hasChanges = items.length !== prevItems.length || 
            items.some(newItem => {
              const existingItem = prevItems.find(
                item => item.cartItemId === newItem.cartItemId
              );
              return !existingItem || existingItem.quantity !== newItem.quantity;
            });
          
          if (!hasChanges) {
            return prevItems; // No changes, return previous state to avoid re-render
          }
          
          // Keep the delivery info when updating items
          return items.map(newItem => {
            const existingItem = prevItems.find(
              item => item.cartItemId === newItem.cartItemId
            );
            if (existingItem) {
              return { 
                ...newItem, 
                delivery: existingItem.delivery 
              } as CartItem;
            }
            // If we don't have delivery info for some reason, use default
            return { 
              ...newItem, 
              delivery: { 
                cost: '350 р', 
                estimatedTime: '1-3 дня' 
              } 
            } as CartItem;
          });
        });
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const updateQuantity = async (cartItemId: string, change: number) => {
    if (global.cartStorage) {
      global.cartStorage.updateQuantity(cartItemId, change);
      
      // Get updated items
      const updatedItems = [...global.cartStorage.getItems()];
      
      // Find the item that was updated
      const updatedItem = updatedItems.find(item => item.cartItemId === cartItemId);
      
      if (updatedItem) {
        // Update delivery info for the item with new quantity
        try {
          // Make sure we pass a number to getItemDeliveryInfo
          const delivery = await getItemDeliveryInfo(updatedItem.id, updatedItem.quantity);
          
          // Map through all items and update the specific one
          const itemsWithUpdatedDelivery = updatedItems.map(item => 
            item.cartItemId === cartItemId 
              ? { ...item, delivery } as CartItem 
              : { 
                  ...item, 
                  delivery: (cartItems.find(ci => ci.cartItemId === item.cartItemId)?.delivery || {
                    cost: '350 р',
                    estimatedTime: '1-3 дня'
                  })
                } as CartItem
          );
          
          setCartItems(itemsWithUpdatedDelivery);
        } catch (error) {
          console.error(`Error updating delivery info for item ${cartItemId}:`, error);
          // Ensure all items have delivery info
          const safeItems = updatedItems.map(item => {
            const existingItem = cartItems.find(ci => ci.cartItemId === item.cartItemId);
            return {
              ...item,
              delivery: existingItem?.delivery || {
                cost: '350 р',
                estimatedTime: '1-3 дня'
              }
            } as CartItem;
          });
          setCartItems(safeItems);
        }
      } else {
        // Ensure all items have delivery info
        const safeItems = updatedItems.map(item => {
          const existingItem = cartItems.find(ci => ci.cartItemId === item.cartItemId);
          return {
            ...item,
            delivery: existingItem?.delivery || {
              cost: '350 р',
              estimatedTime: '1-3 дня'
            }
          } as CartItem;
        });
        setCartItems(safeItems);
      }
    }
  };

  const removeItem = (cartItemId: string) => {
    if (global.cartStorage) {
      global.cartStorage.removeItem(cartItemId);
      setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
    }
  };
  
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

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      // Add item price (no longer multiplying by quantity)
      const price = parseInt(item.price.replace(/\D/g, ''));
      
      // Add delivery cost
      const deliveryCost = parseInt(item.delivery.cost.replace(/\D/g, ''));
      
      return total + price + deliveryCost;
    }, 0).toLocaleString().replace(/\s/g, '') + 'р';
  };

    


  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInDown.duration(500)}
        style={styles.roundedBox}
      >
        <LinearGradient
          colors={["rgba(205, 166, 122, 0.5)", "transparent"]}
          start={{ x: 0.1, y: 1 }}
          end={{ x: 0.9, y: 0.3 }}
          locations={[0.1, 1]}
          style={styles.gradientBackground}
        />
      <Animated.View style={styles.whiteBox} entering={FadeInDown.duration(500).delay(50)}>
        
        {cartItems.length === 0 ? (
          <Animated.View 
            entering={FadeInDown.duration(500).delay(100)}
            style={styles.emptyCartContainer}
          >
            <Text style={styles.emptyCartText}>Ваша корзина пуста</Text>
            <Pressable 
              style={styles.shopButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.shopButtonText}>Продолжить покупки</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
              {cartItems.map((item, index) => (
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
                          <Text style={styles.deliveryText}>
                            ожидание
                          </Text>
                          <Text style={styles.deliveryText}>
                            доставка
                          </Text>
                        </View>

                        <View style={styles.deliveryInfoChangeable}>
                        <Text style={styles.deliveryText}>
                            {item.delivery.estimatedTime}
                          </Text>
                          <Text style={styles.deliveryText}>
                            {item.delivery.cost}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.rightContainer}>
                      <CancelButton 
                        onRemove={removeItem} 
                        cartItemId={item.cartItemId || `${item.id}-${item.size}-${index}`} 
                      />
                      <View style={styles.circle}>
                      <Canvas style={{ width: 41, height: 41, backgroundColor: 'transparent' }}>
                        <RoundedRect x={0} y={0} width={41} height={41} r={20.5} color="white">
                          <Shadow dx={0} dy={4} blur={4} color="rgba(0,0,0,0.25)" inner />
                        </RoundedRect>
                      </Canvas>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
            
            <Animated.View 
              entering={FadeInDown.duration(500).delay(250)}
              style={styles.checkoutContainer}
            >
              <View style={styles.summaryContainer}>
                <View style={styles.horizontalLine}/>
                {/* Simplified checkout - only show the final total */}
                <View style={styles.totalContainer}>
                  <Text style={styles.totalText}>ИТОГО {calculateTotal()}</Text>
                </View>
              </View>
              
              <Pressable style={styles.checkoutButton}>
                <Text style={styles.checkoutButtonText}>ОФОРМИТЬ ЗАКАЗ</Text>
              </Pressable>
            </Animated.View>
          </>
        )}
        </Animated.View>
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            КОРЗИНА
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
    backgroundColor: 'transparent',
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
  },
  title: {
    fontFamily: 'IgraSans',
    fontSize: 38,
    color: '#4A3120',
    marginBottom: 20,
    marginLeft: 10,
  },
  itemsContainer: {
    height: '70%',
    borderRadius: 41,
    padding: 16,
    paddingTop: 25,
  },
  cartItem: {
    backgroundColor: 'rgba(216, 182, 143, 0.6)',
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
  itemImage: {
    width: '100%',
    height: undefined,
    justifyContent: 'flex-start',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imageContainer: {
    width: '30%',
    height: '100%',
    alignSelf: 'flex-start',
    marginRight: 15,
    justifyContent: 'flex-start',
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
    marginLeft: width*0.22,
    bottom: 0,
  },
  deliveryText: {
    fontFamily: 'IgraSans',
    fontSize: 14,
    color: '#000',
    marginBottom: 5,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  quantityText: {
    marginHorizontal: 15,
    fontSize: 16,
    fontFamily: 'REM',
    color: '#FFFFFF',
  },
  rightContainer: {
    justifyContent: 'center', // Center vertically
    alignItems: 'center',
    height: '100%',
    width: '20%',
  },
  removeButton: {
    width: 25,
    height: 25,
    borderRadius: 7,
    backgroundColor: 'rgba(230, 109, 123, 0.54)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 8,
    top: 0,
  },
  circle: {
    position: 'absolute',
    top: '30%',
    bottom: '30%',
    right:0,
  },
  checkoutContainer: {
    borderRadius: 41,
    padding: 20,
    alignItems: 'center',
  },
  summaryContainer: {
    marginBottom: 10,
    width: '87%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalLine: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  totalContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 25,
  },
  totalText: {
    textAlign: 'left',
    fontFamily: 'IgraSans',
    fontSize: 34,
    color: '#000',
  },
  checkoutButton: {
    width: '100%',
    backgroundColor: '#98907E',
    borderRadius: 41,
    padding: 25,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#FFFFF5',
    fontFamily: 'IgraSans',
    fontSize:20,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    fontFamily: 'REM',
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#CDA67A',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    width: '80%',
  },
  shopButtonText: {
    color: 'white',
    fontFamily: 'IgraSans',
    fontSize: 18,
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
  innerShadowTop: {
    position: 'absolute',
    top: 0,
    left: 5,
    right: 5,
    height: 5,
    borderTopLeftRadius: 20.5,
    borderTopRightRadius: 20.5,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  innerShadowLeft: {
    position: 'absolute',
    top: 5,
    left: 0,
    bottom: 5,
    width: 5,
    borderTopLeftRadius: 20.5,
    borderBottomLeftRadius: 20.5,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
  },
  innerShadowRight: {
    position: 'absolute',
    top: 5,
    right: 0,
    bottom: 5,
    width: 5,
    borderTopRightRadius: 20.5,
    borderBottomRightRadius: 20.5,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
  },
  innerShadowBottom: {
    position: 'absolute',
    bottom: 0,
    left: 5,
    right: 5,
    height: 5,
    borderBottomLeftRadius: 20.5,
    borderBottomRightRadius: 20.5,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});

export default Cart;