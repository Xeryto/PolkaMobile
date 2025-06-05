import React, { useState, useRef } from 'react';
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
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeOutDown } from 'react-native-reanimated';
import BackIcon from './assets/Back.svg';
import * as Haptics from 'expo-haptics';

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
  
  // Animation values
  const sizeContainerWidth = useRef(new RNAnimated.Value(height*0.1)).current;
  const sizeTextOpacity = useRef(new RNAnimated.Value(0)).current;
  const sizeIndicatorOpacity = useRef(new RNAnimated.Value(1)).current;

  const stats: StatItem[] = [
    { label: 'Просмотрено', value: '1,234' },
    { label: 'Куплено', value: '56' },
  ];

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL'];

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

  const renderMainButton = (title: string, section: 'wall' | 'orders' | 'payment' | 'support', delay: number) => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(300+delay)}
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
    <Animated.View entering={FadeInDown.duration(400)} style={{width: '100%', alignItems: 'center', justifyContent: 'space-between', height: '100%'}}>
      {/* Profile Section */}
      <Animated.View entering={FadeInDown.duration(400).delay(250)}>
        <Text style={styles.profileName}>Иван Иванов</Text>
      </Animated.View>
            
      <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.profileImageContainer}>
        <Image 
          source={require('./assets/Vision.png')} 
          style={styles.profileImage}
        />
      </Animated.View>
      <Animated.View 
      //entering={FadeInDown.duration(400)}
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
    <Animated.View 
      entering={FadeInDown.duration(400).delay(200)}
      style={styles.overlayContent}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setActiveSection(null)}
      >
        <BackIcon width={33} height={33} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Стена</Text>
      
      {/* Favorite Brands Button */}
      <Pressable 
        style={styles.favoriteBrandsButton}
        onPress={() => navigation.navigate('FavoriteBrands')}
      >
        <Text style={styles.favoriteBrandsText}>Любимые бренды</Text>
      </Pressable>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Size Selection */}
      <View style={styles.sizeSection}>
        <Text style={styles.sizeSectionTitle}>Размер</Text>
        <Pressable 
          style={styles.sizeSelectionWrapper}
          onPress={handleSizePress}
        >
          {renderSizeSelection()}
        </Pressable>
      </View>
    </Animated.View>
  );

  const renderOrdersContent = () => (
    <Animated.View 
      entering={FadeInDown.duration(400)}
      style={styles.overlayContent}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setActiveSection(null)}
      >
        <BackIcon width={33} height={33} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Заказы</Text>
      <View style={styles.ordersContainer}>
        <Text style={styles.emptyStateText}>У вас пока нет заказов</Text>
        <Pressable 
          style={styles.startShoppingButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.startShoppingText}>Начать покупки</Text>
        </Pressable>
      </View>
    </Animated.View>
  );

  const renderPaymentContent = () => (
    <Animated.View 
      entering={FadeInDown.duration(400)}
      style={styles.overlayContent}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setActiveSection(null)}
      >
        <BackIcon width={33} height={33} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Способ оплаты</Text>
      <View style={styles.paymentContainer}>
        <Pressable style={styles.paymentMethodButton}>
          <Text style={styles.paymentMethodText}>Добавить карту</Text>
        </Pressable>
        <Text style={styles.paymentInfoText}>
          Добавьте способ оплаты для быстрых покупок
        </Text>
      </View>
    </Animated.View>
  );

  const renderSupportContent = () => (
    <Animated.View 
      entering={FadeInDown.duration(400)}
      style={styles.overlayContent}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setActiveSection(null)}
      >
        <BackIcon width={33} height={33} />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Поддержка</Text>
      <View style={styles.supportContainer}>
        <Pressable style={styles.supportButton}>
          <Text style={styles.supportButtonText}>Написать в поддержку</Text>
        </Pressable>
        <Pressable style={styles.supportButton}>
          <Text style={styles.supportButtonText}>FAQ</Text>
        </Pressable>
        <Pressable style={styles.supportButton}>
          <Text style={styles.supportButtonText}>Политика конфиденциальности</Text>
        </Pressable>
      </View>
    </Animated.View>
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
        

          {/* Content Box */}
          <Animated.View 
            entering={FadeInDown.duration(400).delay(200)}
            style={styles.whiteBox}
          >
            {renderContent()}
          </Animated.View>

          {/* Bottom Text */}
          <View style={styles.textContainer}>
            <Text style={styles.text}>
              НАСТРОЙКИ
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
  overlayContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F2ECE7',
    borderRadius: 41,
    padding: 20,
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 11,
  },
  sectionTitle: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#6A462F',
    marginBottom: 15,
    marginTop: 60,
  },
  favoriteBrandsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  favoriteBrandsText: {
    fontFamily: 'REM',
    fontSize: 16,
    color: '#6A462F',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'IgraSans',
    fontSize: 24,
    color: '#6A462F',
    marginBottom: 5,
  },
  statLabel: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#CDA67A',
  },
  sizeSection: {
    marginTop: 10,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'rgba(216, 182, 143, 0.6)',
    height: height*0.1,
    borderRadius: 41,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  sizeSectionTitle: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#000',
    marginLeft: 20,
    textAlign: 'left'
    //marginBottom: 10,
  },
  sizeSelectionWrapper: {
    height: '100%',
    position: 'absolute',
    right: 0,
  },
  sizeSelectionContainer: {
    height: '100%',
    minWidth: height*0.1,
    borderRadius: 41,
    backgroundColor: 'rgba(216, 182, 143, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    marginRight: 10,
  },
  sizeTextWrapper: {
    paddingVertical: 5,
  },
  sizeText: {
    color: 'black',
    fontFamily: 'IgraSans',
    fontSize: 20,
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
    //backgroundColor: '#white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeIndicatorText: {
    color: 'black',
    fontFamily: 'IgraSans',
    fontSize: 20,
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
});

export default Settings; 