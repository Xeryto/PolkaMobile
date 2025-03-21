import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// Define a simpler navigation type that our custom navigation can satisfy
interface SimpleNavigation {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface CartProps {
  navigation: SimpleNavigation;
}

interface CartItem {
  id: number;
  name: string;
  price: string;
  size: string;
  image: any;
  quantity: number;
  isLiked?: boolean; // Add this line
}

const Cart = ({ navigation }: CartProps) => {
  // Use state to ensure UI updates when cart changes
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Load cart items on mount and when component gains focus
  useEffect(() => {
    // Load the initial cart items
    if (global.cartStorage) {
      setCartItems([...global.cartStorage.getItems()]);
    }
    
    // Set up an interval to refresh cart items (simulates realtime updates)
    const intervalId = setInterval(() => {
      if (global.cartStorage) {
        setCartItems([...global.cartStorage.getItems()]);
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const updateQuantity = (id: number, change: number) => {
    if (global.cartStorage) {
      global.cartStorage.updateQuantity(id, change);
      setCartItems([...global.cartStorage.getItems()]);
    }
  };

  const removeItem = (id: number) => {
    if (global.cartStorage) {
      global.cartStorage.removeItem(id);
      setCartItems([...global.cartStorage.getItems()]);
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
      const price = parseInt(item.price.replace(/\D/g, ''));
      return total + (price * item.quantity);
    }, 0).toLocaleString() + ' р';
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(500)}
        style={styles.roundedBox}
      >
        <LinearGradient
          colors={["rgba(205, 166, 122, 0.4)", "rgba(205, 166, 122, 0)"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0.3 }}
          style={styles.gradientBackground}
        />
        
        <Text style={styles.title}>Your Cart</Text>
        
        {cartItems.length === 0 ? (
          <Animated.View 
            entering={FadeInDown.duration(500).delay(300)}
            style={styles.emptyCartContainer}
          >
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <Pressable 
              style={styles.shopButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.shopButtonText}>Continue Shopping</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
              {cartItems.map((item, index) => (
                <Animated.View 
                  key={`${item.id}-${item.size}-${index}`}
                  entering={FadeInDown.duration(500).delay(200 + index * 100)}
                  style={styles.cartItem}
                >
                  <Pressable 
                    style={styles.itemPressable}
                    onPress={() => handleItemPress(item)}
                  >
                    <Image source={item.image} style={styles.itemImage} />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>{item.price}</Text>
                      <Text style={styles.itemSize}>Size: {item.size}</Text>
                      <View style={styles.quantityContainer}>
                        <Pressable 
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, -1)}
                        >
                          <Text style={styles.quantityButtonText}>-</Text>
                        </Pressable>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <Pressable 
                          style={styles.quantityButton}
                          onPress={() => updateQuantity(item.id, 1)}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                  <Pressable 
                    style={styles.removeButton}
                    onPress={() => removeItem(item.id)}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
            
            <Animated.View 
              entering={FadeInDown.duration(500).delay(500)}
              style={styles.checkoutContainer}
            >
              <View style={styles.totalContainer}>
                <Text style={styles.totalText}>Total:</Text>
                <Text style={styles.totalAmount}>{calculateTotal()}</Text>
              </View>
              <Pressable style={styles.checkoutButton}>
                <Text style={styles.checkoutButtonText}>Checkout</Text>
              </Pressable>
            </Animated.View>
          </>
        )}
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
    height: '95%',
    borderRadius: 41,
    backgroundColor: 'rgba(205, 166, 122, 0)',
    position: 'relative',
    borderWidth: 3,
    borderColor: 'rgba(205, 166, 122, 0.4)',
    padding: 20,
  },
  title: {
    fontFamily: 'IgraSans',
    fontSize: 38,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  itemsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#F2ECE7',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontFamily: 'IgraSans',
    fontSize: 18,
    marginBottom: 5,
  },
  itemPrice: {
    fontFamily: 'REM',
    fontSize: 16,
    color: '#6A462F',
    marginBottom: 5,
  },
  itemSize: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: '#E2CCB2',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  quantityText: {
    marginHorizontal: 15,
    fontSize: 16,
    fontFamily: 'REM',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    fontSize: 20,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  checkoutContainer: {
    backgroundColor: '#F2ECE7',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
  },
  totalAmount: {
    fontFamily: 'REM',
    fontSize: 20,
    color: '#6A462F',
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#CDA67A',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontFamily: 'IgraSans',
    fontSize: 18,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    fontFamily: 'REM',
    fontSize: 18,
    color: 'white',
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#CDA67A',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: '80%',
  },
  shopButtonText: {
    color: 'white',
    fontFamily: 'IgraSans',
    fontSize: 18,
  },
  itemPressable: {
    flexDirection: 'row',
    flex: 1,
  },
});

export default Cart;