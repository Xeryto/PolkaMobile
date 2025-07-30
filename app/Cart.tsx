import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable, SafeAreaView, Dimensions, Easing, Animated as RNAnimated, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';
import Cancel from './assets/Cancel.svg';
import { RoundedRect, Shadow, Canvas } from '@shopify/react-native-skia';
import * as api from './services/api';
import { retrieveUserProfile, getPaymentStatus } from './services/api';

const { height, width } = Dimensions.get('window');

interface SimpleNavigation {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
}

interface CartProps {
  navigation: SimpleNavigation;
}

interface DeliveryInfo {
  cost: string;
  estimatedTime: string;
}

interface CartItem {
  id: string;
  name: string;
  price: string;
  size: string;
  image: any;
  quantity: number;
  isLiked?: boolean;
  delivery: DeliveryInfo;
  cartItemId?: string;
}

const getItemDeliveryInfo = (itemId: string, quantity: number): Promise<DeliveryInfo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let cost = '350 р';
      let time = '1-3 дня';
      const numericId = parseInt(itemId) || 0;
      if (numericId % 3 === 0) {
        cost = '250 р';
        time = '2-4 дня';
      } else if (numericId % 2 === 0) {
        cost = '400 р';
        time = '1 день';
      }
      if (quantity > 1) {
        const baseCost = parseInt(cost.replace(/\D/g, ''));
        const adjustedCost = Math.round(baseCost * (1 + (quantity - 1) * 0.1));
        cost = `${adjustedCost} р`;
      }
      resolve({ cost, estimatedTime: time });
    }, 200);
  });
};

interface CancelButtonProps {
  onRemove: (cartItemId: string) => void;
  cartItemId: string;
}

const CancelButton: React.FC<CancelButtonProps> = ({ onRemove, cartItemId }) => {
  const scale = useRef(new RNAnimated.Value(1)).current;
  const handlePressIn = () => RNAnimated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }).start();
  const handlePressOut = () => {
    RNAnimated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }).start();
    onRemove(cartItemId);
  };
  return (
    <RNAnimated.View style={[{ transform: [{ scale }] }, styles.removeButton]}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
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
  const aspectRatio = imageDimensions.width && imageDimensions.height ? imageDimensions.width / imageDimensions.height : 1;
  return (
    <View style={styles.container}>
      <Image source={item.image} style={[styles.itemImage, { aspectRatio }]} resizeMode="contain" onLoad={onImageLoad} />
    </View>
  );
};

const Cart = ({ navigation }: CartProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = new URL(event.url);
      const paymentId = url.searchParams.get('payment_id');

      console.log(paymentId)
      if (paymentId) {
        try {
          const paymentStatusResponse = await api.getPaymentStatus(paymentId);

          if (paymentStatusResponse.status === 'succeeded') {
            setShowConfirmation(true);
          } else if (paymentStatusResponse.status === 'canceled') {
            setPaymentError('Payment was canceled.');
          } else {
            setPaymentError('Payment status is unknown or pending.');
          }
        } catch (error) {
          setPaymentError('Failed to verify payment status.');
        }
      }
    };

    Linking.addEventListener('url', handleDeepLink);
    return () => {
      Linking.removeAllListeners('url');
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (global.cartStorage) {
        const items = [...global.cartStorage.getItems()];
        const itemsWithDelivery = await Promise.all(
          items.map(async (item) => {
            try {
              const delivery = await getItemDeliveryInfo(item.id, item.quantity);
              return { ...item, delivery, cartItemId: item.cartItemId || `${item.id}-${item.size}-${Date.now()}` } as CartItem;
            } catch (error) {
              return { ...item, delivery: { cost: '350 р', estimatedTime: '1-3 дня' }, cartItemId: item.cartItemId || `${item.id}-${item.size}-${Date.now()}` } as CartItem;
            }
          })
        );
        setCartItems(itemsWithDelivery);
      }
      setIsLoading(false);
    };
    loadData();
    const intervalId = setInterval(() => {
      if (global.cartStorage) {
        const items = [...global.cartStorage.getItems()];
        setCartItems(prevItems => {
          const hasChanges = items.length !== prevItems.length || items.some(newItem => !prevItems.find(item => item.cartItemId === newItem.cartItemId && item.quantity === newItem.quantity));
          if (!hasChanges) return prevItems;
          return items.map(newItem => {
            const existingItem = prevItems.find(item => item.cartItemId === newItem.cartItemId);
            return { ...newItem, delivery: existingItem ? existingItem.delivery : { cost: '350 р', estimatedTime: '1-3 дня' } } as CartItem;
          });
        });
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const removeItem = (cartItemId: string) => {
    if (global.cartStorage) {
      global.cartStorage.removeItem(cartItemId);
      setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
    }
  };

  const handleItemPress = (item: CartItem) => {
    const cardItem = { id: item.id, name: item.name, price: item.price, image: item.image, isLiked: item.isLiked };
    navigation.navigate('Home', { addCardItem: cardItem });
  };

  const calculateRawTotal = () => cartItems.reduce((total, item) => total + parseInt(item.price.replace(/\D/g, '')) + parseInt(item.delivery.cost.replace(/\D/g, '')), 0);
  const calculateTotal = () => calculateRawTotal().toLocaleString() + 'р';

  const handleCheckout = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setPaymentError(null);
    try {
      const totalAmount = calculateRawTotal();
      if (totalAmount <= 0) {
        setPaymentError("Cannot proceed with an empty cart.");
        setIsSubmitting(false);
        return;
      }
      const currentUserProfile = await retrieveUserProfile();
      console.log(cartItems[0])
      const receiptItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        size: item.size
      }));

      const paymentDetails: api.PaymentCreateRequest = {
        amount: {
          value: totalAmount.toFixed(2), // Convert number to string with 2 decimal places
          currency: 'RUB',
        },
        description: `Order #${Math.floor(Math.random() * 1000)}`,
        returnUrl: 'polkamobile://payment-callback', // Generic base deep link
        items: receiptItems,
      };

      const { confirmation_url, payment_id } = await api.createPayment(paymentDetails);
      if (!confirmation_url) throw new Error('Failed to retrieve confirmation URL.');
      await WebBrowser.openBrowserAsync(confirmation_url);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    if (global.cartStorage) {
      cartItems.forEach(item => item.cartItemId && global.cartStorage.removeItem(item.cartItemId));
      setCartItems([]);
    }
    navigation.navigate('Home');
  };

  const LoadingScreen = () => <Animated.View entering={FadeIn.duration(300)} style={styles.loadingContainer}><Text style={styles.loadingText}>Перенаправление на оплату...</Text></Animated.View>;
  const ConfirmationScreen = () => <Animated.View entering={FadeIn.duration(300)} style={styles.confirmationContainer}><Text style={styles.confirmationTitle}>Заказ оформлен!</Text><Text style={styles.confirmationText}>Спасибо за покупку</Text><TouchableOpacity style={styles.confirmationButton} onPress={handleConfirmationClose}><Text style={styles.confirmationButtonText}>Вернуться к покупкам</Text></TouchableOpacity></Animated.View>;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.roundedBox}>
        <LinearGradient colors={["rgba(205, 166, 122, 0.5)", "transparent"]} start={{ x: 0.1, y: 1 }} end={{ x: 0.9, y: 0.3 }} locations={[0.1, 1]} style={styles.gradientBackground} />
        <Animated.View style={styles.whiteBox}>
          {isSubmitting && !showConfirmation ? <LoadingScreen /> : showConfirmation ? <ConfirmationScreen /> : cartItems.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.emptyCartContainer}>
              <Text style={styles.emptyCartText}>Ваша корзина пуста</Text>
              <Pressable style={styles.shopButton} onPress={() => navigation.navigate('Home')}><Text style={styles.shopButtonText}>Продолжить покупки</Text></Pressable>
            </Animated.View>
          ) : (
            <>
              <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
                {cartItems.map((item, index) => (
                  <Animated.View key={item.cartItemId || `${item.id}-${item.size}-${index}`} entering={FadeInDown.duration(500).delay(100 + index * 50)} style={styles.cartItem}>
                    <Pressable style={styles.itemPressable} onPress={() => handleItemPress(item)}>
                      <View style={styles.itemContent}>
                        <View style={styles.imageContainer}><CartItemImage item={item} /></View>
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                          <Text style={styles.itemPrice}>{item.price}</Text>
                          <Text style={styles.itemSize}>{item.size}</Text>
                          <View><Text style={styles.deliveryText}>ожидание</Text><Text style={styles.deliveryText}>доставка</Text></View>
                          <View style={styles.deliveryInfoChangeable}><Text style={styles.deliveryText}>{item.delivery.estimatedTime}</Text><Text style={styles.deliveryText}>{item.delivery.cost}</Text></View>
                        </View>
                      </View>
                      <View style={styles.rightContainer}>
                        <CancelButton onRemove={removeItem} cartItemId={item.cartItemId || `${item.id}-${item.size}-${index}`} />
                        <View style={styles.circle}><Canvas style={{ width: 41, height: 41, backgroundColor: 'transparent' }}><RoundedRect x={0} y={0} width={41} height={41} r={20.5} color="white"><Shadow dx={0} dy={4} blur={4} color="rgba(0,0,0,0.5)" inner /></RoundedRect></Canvas></View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
              <Animated.View style={styles.checkoutContainer}>
                <Animated.View style={styles.summaryContainer} entering={FadeInDown.duration(500).delay(200)}>
                  <View style={styles.horizontalLine} />
                  <View style={styles.totalContainer}><Text style={styles.totalText}>ИТОГО {calculateTotal()}</Text></View>
                </Animated.View>
                {paymentError && <Animated.View entering={FadeIn.duration(300)}><Text style={styles.errorText}>{paymentError}</Text></Animated.View>}
                <Animated.View entering={FadeInDown.duration(500).delay(250)}>
                  <TouchableOpacity style={[styles.checkoutButton, isSubmitting && styles.disabledButton]} onPress={handleCheckout} disabled={isSubmitting}>
                    <Text style={styles.checkoutButtonText}>{isSubmitting ? 'ОБРАБОТКА...' : 'ОФОРМИТЬ ЗАКАЗ'}</Text>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </>
          )}
        </Animated.View>
        <View style={styles.textContainer}><Text style={styles.text}>КОРЗИНА</Text></View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  roundedBox: { width: '88%', height: '95%', borderRadius: 41, backgroundColor: 'rgba(205, 166, 122, 0)', position: 'relative', borderWidth: 3, borderColor: 'rgba(205, 166, 122, 0.4)' },
  gradientBackground: { borderRadius: 37, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  whiteBox: { backgroundColor: '#F2ECE7', borderRadius: 41, width: width * 0.88, top: -3, left: -3, height: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 6 },
  itemsContainer: { height: '70%', borderRadius: 41, padding: height * 0.02 },
  cartItem: { backgroundColor: '#E2CCB2', borderRadius: 41, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 6, flex: 1 },
  itemPressable: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 20, paddingLeft: 25, paddingRight: 20, paddingBottom: 15 },
  itemContent: { flexDirection: 'row', width: '80%', alignItems: 'flex-start' },
  itemImage: { width: '100%', height: undefined, justifyContent: 'flex-start', position: 'absolute', top: 0, left: 0 },
  imageContainer: { width: '30%', height: '100%', alignSelf: 'flex-start', marginRight: 15, justifyContent: 'flex-start' },
  itemDetails: { flex: 1, justifyContent: 'flex-start' },
  itemName: { fontFamily: 'IgraSans', fontSize: 38, color: '#000', marginBottom: 0 },
  itemPrice: { fontFamily: 'REM', fontSize: 16, color: '#000', marginBottom: 5 },
  itemSize: { fontFamily: 'IgraSans', fontSize: 16, color: '#000', marginBottom: 20 },
  deliveryInfoChangeable: { position: 'absolute', marginLeft: width * 0.22, bottom: 0 },
  deliveryText: { fontFamily: 'IgraSans', fontSize: 14, color: '#000', marginBottom: 5 },
  rightContainer: { justifyContent: 'center', alignItems: 'center', height: '100%', width: '20%' },
  removeButton: { width: 25, height: 25, borderRadius: 7, backgroundColor: 'rgba(230, 109, 123, 0.54)', justifyContent: 'center', alignItems: 'center', position: 'absolute', right: 8, top: 0 },
  circle: { position: 'absolute', top: '30%', bottom: '30%', right: 0 },
  checkoutContainer: { borderRadius: 41, padding: 20, alignItems: 'center' },
  summaryContainer: { marginBottom: 10, width: '87%', alignItems: 'center', justifyContent: 'center' },
  horizontalLine: { width: '100%', height: 3, backgroundColor: 'rgba(0, 0, 0, 1)' },
  totalContainer: { width: '100%', alignItems: 'flex-start', marginTop: 25 },
  totalText: { textAlign: 'left', fontFamily: 'IgraSans', fontSize: 34, color: '#000' },
  checkoutButton: { width: '100%', backgroundColor: '#98907E', borderRadius: 41, padding: 25, alignItems: 'center' },
  checkoutButtonText: { color: '#FFFFF5', fontFamily: 'IgraSans', fontSize: 20 },
  disabledButton: { backgroundColor: '#BDBDBD' },
  emptyCartContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCartText: { fontFamily: 'REM', fontSize: 18, color: '#666', marginBottom: 20 },
  shopButton: { backgroundColor: '#CDA67A', borderRadius: 25, padding: 15, alignItems: 'center', width: '80%' },
  shopButtonText: { color: 'white', fontFamily: 'IgraSans', fontSize: 18 },
  textContainer: { position: 'absolute', bottom: 0, marginBottom: 12, marginLeft: 22 },
  text: { fontFamily: 'Igra Sans', fontSize: 38, color: '#FFF', textAlign: 'left' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2ECE7', borderRadius: 41 },
  loadingText: { fontFamily: 'IgraSans', fontSize: 24, color: '#4A3120' },
  confirmationContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2ECE7', borderRadius: 41, padding: 20 },
  confirmationTitle: { fontFamily: 'IgraSans', fontSize: 38, color: '#4A3120', marginBottom: 20, textAlign: 'center' },
  confirmationText: { fontFamily: 'REM', fontSize: 18, color: '#666', marginBottom: 40, textAlign: 'center' },
  confirmationButton: { backgroundColor: '#CDA67A', borderRadius: 25, padding: 15, alignItems: 'center', width: '80%' },
  confirmationButtonText: { color: 'white', fontFamily: 'IgraSans', fontSize: 18 },
  errorText: { color: '#D32F2F', fontFamily: 'REM', fontSize: 16, textAlign: 'center', marginBottom: 15 },
});

export default Cart;