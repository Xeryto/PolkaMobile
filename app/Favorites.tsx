import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable,
  Image,
  Dimensions,
  TextInput,
  Platform,
  InteractionManager
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeOutDown,
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import PlusSvg from './assets/Plus.svg';

// Define a simpler navigation type that our custom navigation can satisfy
interface SimpleNavigation {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  addListener?: (event: string, callback: () => void) => () => void;
}

interface FavoritesProps {
  navigation: SimpleNavigation;
}

interface FavoriteItem {
  id: number;
  name: string;
  price: string;
  image: any;
}

const { width, height } = Dimensions.get('window');

// Use platform-specific animation configs
const ANIMATION_CONFIG = {
  duration: Platform.OS === 'ios' ? 400 : 300, // Faster on Android
  easing: Easing.bezier(0.25, 0.1, 0.25, 1)
};

// Disable complex animations on Android for better performance
const USE_ANIMATIONS = Platform.OS === 'ios';

const Favorites = ({ navigation }: FavoritesProps) => {
  // Basic state
  const [activeView, setActiveView] = useState<'friends' | 'saved'>('friends');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(true);
  const [isReady, setIsReady] = useState(false); // Control initial render
  
  // Opacity values for the main view and search view
  const mainViewOpacity = useSharedValue(1);
  const searchViewOpacity = useSharedValue(0);
  
  // Animation value for press animation
  const pressAnimationScale = useSharedValue(1);
  
  // Sample data for saved items and friend items
  const savedItems: FavoriteItem[] = [
    { 
      id: 1, 
      name: 'SAVED ITEM 1', 
      price: '25 000 р', 
      image: require('./assets/Vision.png')
    },
    { 
      id: 2, 
      name: 'SAVED ITEM 2', 
      price: '30 000 р', 
      image: require('./assets/Vision2.png')
    },
    { 
      id: 3, 
      name: 'SAVED ITEM 3', 
      price: '22 000 р', 
      image: require('./assets/Vision.png')
    },
    { 
      id: 4, 
      name: 'SAVED ITEM 4', 
      price: '18 000 р', 
      image: require('./assets/Vision2.png')
    },
  ];

  const friendItems: FavoriteItem[] = [
    { 
      id: 5, 
      name: 'FRIEND ITEM 1', 
      price: '27 000 р', 
      image: require('./assets/Vision2.png')
    },
    { 
      id: 6, 
      name: 'FRIEND ITEM 2', 
      price: '32 000 р', 
      image: require('./assets/Vision.png')
    },
    { 
      id: 7, 
      name: 'FRIEND ITEM 3', 
      price: '19 000 р', 
      image: require('./assets/Vision2.png')
    },
    { 
      id: 8,
      name: 'FRIEND ITEM 4', 
      price: '24 000 р', 
      image: require('./assets/Vision.png')
    },
  ];
  
  // Animated styles for main view and search view - avoid using .value in render
  const mainViewAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: mainViewOpacity.value,
    display: mainViewOpacity.value === 0 ? 'none' : 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  }));
  
  const searchViewAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: searchViewOpacity.value,
    display: searchViewOpacity.value === 0 ? 'none' : 'flex',
  }));
  
  // Create animated style for bottom box press animation only
  const bottomBoxAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [
      { scale: pressAnimationScale.value },
    ],
  }));

  // Use InteractionManager to delay heavy operations until animations complete
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });

    return () => task.cancel();
  }, []);
  
  // Cleanup animations on unmount
  useEffect(() => {
    setIsMounted(true);
    
    return () => {
      setIsMounted(false);
      cancelAnimation(mainViewOpacity);
      cancelAnimation(searchViewOpacity);
      cancelAnimation(pressAnimationScale);
    };
  }, []);
  
  // Handle search activation/deactivation
  useEffect(() => {
    if (!isMounted) return;
    
    if (isSearchActive) {
      // Fade out main view, fade in search view
      mainViewOpacity.value = withTiming(0, ANIMATION_CONFIG);
      searchViewOpacity.value = withTiming(1, ANIMATION_CONFIG);
    } else {
      // Fade in main view, fade out search view
      mainViewOpacity.value = withTiming(1, ANIMATION_CONFIG);
      searchViewOpacity.value = withTiming(0, ANIMATION_CONFIG);
    }
  }, [isSearchActive, isMounted]);
  
  // Simplify toggle view with no animations
  const toggleView = () => {
    console.log('Toggling view from', activeView, 'to', activeView === 'friends' ? 'saved' : 'friends');
    // Use InteractionManager to avoid UI thread blocking
    InteractionManager.runAfterInteractions(() => {
      // Simply toggle the view without animations
      setActiveView(activeView === 'friends' ? 'saved' : 'friends');
    });
  };

  // Handle search text change
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  // Toggle search mode
  const toggleSearch = () => {
    setIsSearchActive(!isSearchActive);
    if (!isSearchActive) {
      setSearchQuery('');
    }
  };

  // Improved navigation handler with animation cleanup - now with item data passing
  const handleNavigate = (screen: string, item?: FavoriteItem, isSavedItem: boolean = false) => {
    setIsMounted(false);
    // Use a shorter timeout on Android
    const delay = Platform.OS === 'ios' ? 50 : 0;
    setTimeout(() => {
      if (isSavedItem && item && screen === 'Home') {
        // Convert the saved item to a card item format and pass it
        const params = { 
          addCardItem: {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image
          }
        };
        console.log('NAVIGATING TO HOME WITH PARAMS:', params);
        navigation.navigate(screen, params);
      } else if (screen === 'Home') {
        console.log('NAVIGATING TO HOME WITHOUT PARAMS');
        navigation.navigate(screen);
      } else {
        console.log('NAVIGATING TO:', screen);
        navigation.navigate(screen);
      }
    }, delay);
  };

  // Filter friends based on search query
  const filteredFriends = searchQuery.length > 0
    ? friendItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Render a single item - with platform-specific optimizations
  const renderItem = ({ item, index }: { item: FavoriteItem, index: number }) => {
    // Determine if this is a saved item based on current view
    const isSavedItem = activeView === 'saved';
    console.log(`Rendering item ${item.name}, isSavedItem: ${isSavedItem}, activeView: ${activeView}`);
    
    // Simple static rendering for Android
    if (!USE_ANIMATIONS) {
      return (
        <View style={styles.itemWrapper}>
          <View style={styles.itemContainer}>
            <Pressable 
              style={styles.imageContainer}
              onPress={() => {
                console.log(`Item pressed: ${item.name}, isSavedItem: ${isSavedItem}, activeView: ${activeView}`);
                if (isSavedItem) {
                  // Only saved items navigate with params
                  console.log('Navigating with saved item:', item);
                  handleNavigate('Home', item, true);
                } else {
                  // Friend items do nothing
                  console.log('Friend item pressed - doing nothing');
                  // No navigation for friend items
                }
              }}
            >
              <Image source={item.image} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.itemPrice}>{item.price}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      );
    }
    
    // More complex animations for iOS
    return (
      <View style={styles.itemWrapper}>
        <Animated.View
          entering={FadeInDown.duration(400).delay(100 + index * 50)}
          exiting={FadeOutDown.duration(50)}
        >
          <View style={styles.itemContainer}>
            <Pressable 
              style={styles.imageContainer}
              onPress={() => {
                console.log(`Item pressed: ${item.name}, isSavedItem: ${isSavedItem}, activeView: ${activeView}`);
                if (isSavedItem) {
                  // Only saved items navigate with params
                  console.log('Navigating with saved item:', item);
                  handleNavigate('Home', item, true);
                } else {
                  // Friend items do nothing
                  console.log('Friend item pressed - doing nothing');
                  // No navigation for friend items
                }
              }}
            >
              <Image source={item.image} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.itemPrice}>{item.price}</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  };

  // Render a search result item with platform-specific optimizations
  const renderSearchItem = ({ item, index }: { item: FavoriteItem, index: number }) => {
    // Search results are always friend items
    const isSavedItem = false;
    
    // Simple static rendering for Android
    if (!USE_ANIMATIONS) {
      return (
        <View style={styles.searchItemWrapper}>
          <View style={styles.searchItem}>
            <Pressable 
              style={styles.imageContainer}
              onPress={() => {
                // Search results are friend items, so no navigation
                console.log('Search result item pressed - doing nothing');
                // No navigation for search items
              }}
            >
              <Image source={item.image} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.itemPrice}>{item.price}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      );
    }
    
    // More complex animations for iOS
    return (
      <View style={styles.searchItemWrapper}>
        <Animated.View
          entering={FadeInDown.duration(400).delay(100 + index * 50)}
          exiting={FadeOutDown.duration(50)}
        >
          <View style={styles.searchItem}>
            <Pressable 
              style={styles.imageContainer}
              onPress={() => {
                // Search results are friend items, so no navigation
                console.log('Search result item pressed - doing nothing');
                // No navigation for search items
              }}
            >
              <Image source={item.image} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.itemPrice}>{item.price}</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    );
  };
  
  // Handle press animation for bottom box
  const handleBottomBoxPressIn = () => {
    // Quick small scale down for press effect
    pressAnimationScale.value = withTiming(0.98, {
      duration: 100,
      easing: Easing.inOut(Easing.ease)
    });
  };
  
  const handleBottomBoxPressOut = () => {
    // Reset scale after press
    pressAnimationScale.value = withTiming(1, {
      duration: 100,
      easing: Easing.inOut(Easing.ease)
    });
    
    // Just toggle view - no animation concerns
    toggleView();
  };

  // Don't render until interactions are complete
  if (!isReady) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!isMounted) return null;

  // Simplified render method
  return (
    <View style={styles.container}>
      {/* Main view */}
      {Platform.OS === 'ios' ? (
        <Animated.View style={mainViewAnimatedStyle}>
          <MainContent 
            activeView={activeView}
            toggleSearch={toggleSearch}
            handleBottomBoxPressIn={handleBottomBoxPressIn}
            handleBottomBoxPressOut={handleBottomBoxPressOut}
            bottomBoxAnimatedStyle={bottomBoxAnimatedStyle}
            renderItem={renderItem}
            savedItems={savedItems}
            friendItems={friendItems}
            handleNavigate={handleNavigate}
          />
        </Animated.View>
      ) : (
        <View style={[
          styles.absoluteFill,
          { display: isSearchActive ? 'none' : 'flex' }
        ]}>
          <MainContent 
            activeView={activeView}
            toggleSearch={toggleSearch}
            handleBottomBoxPressIn={handleBottomBoxPressIn}
            handleBottomBoxPressOut={handleBottomBoxPressOut}
            bottomBoxAnimatedStyle={bottomBoxAnimatedStyle}
            renderItem={renderItem}
            savedItems={savedItems}
            friendItems={friendItems}
            handleNavigate={handleNavigate}
          />
        </View>
      )}
      
      {/* Search view */}
      {Platform.OS === 'ios' ? (
        <Animated.View style={searchViewAnimatedStyle}>
          <SearchContent 
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            toggleSearch={toggleSearch}
            filteredFriends={filteredFriends}
            renderSearchItem={renderSearchItem}
          />
        </Animated.View>
      ) : (
        <View style={[
          styles.absoluteFill,
          { display: isSearchActive ? 'flex' : 'none' }
        ]}>
          <SearchContent 
            searchQuery={searchQuery}
            handleSearch={handleSearch}
            toggleSearch={toggleSearch}
            filteredFriends={filteredFriends}
            renderSearchItem={renderSearchItem}
          />
        </View>
      )}
    </View>
  );
};

// Define prop types for extracted components
interface MainContentProps {
  activeView: 'friends' | 'saved';
  toggleSearch: () => void;
  handleBottomBoxPressIn: () => void;
  handleBottomBoxPressOut: () => void;
  bottomBoxAnimatedStyle: any; // Animated style object
  renderItem: ({ item, index }: { item: FavoriteItem, index: number }) => React.ReactElement;
  savedItems: FavoriteItem[];
  friendItems: FavoriteItem[];
  handleNavigate: (screen: string, item?: FavoriteItem, isSavedItem?: boolean) => void;
}

interface BottomBoxContentProps {
  activeView: 'friends' | 'saved';
  handleBottomBoxPressIn: () => void;
  handleBottomBoxPressOut: () => void;
  renderItem: ({ item, index }: { item: FavoriteItem, index: number }) => React.ReactElement;
  savedItems: FavoriteItem[];
  friendItems: FavoriteItem[];
  handleNavigate: (screen: string, item?: FavoriteItem, isSavedItem?: boolean) => void;
}

interface SearchContentProps {
  searchQuery: string;
  handleSearch: (text: string) => void;
  toggleSearch: () => void;
  filteredFriends: FavoriteItem[];
  renderSearchItem: ({ item, index }: { item: FavoriteItem, index: number }) => React.ReactElement;
}

// Extracted component for main content to reduce render complexity
const MainContent = ({ 
  activeView, 
  toggleSearch, 
  handleBottomBoxPressIn, 
  handleBottomBoxPressOut,
  bottomBoxAnimatedStyle,
  renderItem,
  savedItems,
  friendItems,
  handleNavigate
}: MainContentProps) => {
  console.log('MainContent - activeView:', activeView);
  return (
  <>
    {/* Top Box (Friends by default) */}
    <View style={[
      styles.topBox,
      { backgroundColor: activeView === 'friends' ? '#C8A688' : '#AE8F72' }
    ]}>
      <View style={{ flex: 1, borderRadius: 41 }}>
        <FlatList
          style={styles.flatList}
          data={activeView === 'friends' ? friendItems : savedItems}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={Platform.OS === 'android'} // Optimize memory usage on Android
          initialNumToRender={4} // Only render what's visible initially
          maxToRenderPerBatch={4} // Limit batch size for smoother scrolling
          windowSize={5} // Reduce window size for performance
        />
        <View style={styles.titleRow}>
          <Text style={styles.boxTitle}>
            {activeView === 'friends' ? 'ДРУЗЬЯ' : 'СОХРАНЁНКИ'}
          </Text>
          {activeView === 'friends' && (
            <Pressable onPress={toggleSearch} style={styles.plusIconContainer}>
              <PlusSvg width={32} height={32} fill="#FFF" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
    
    {/* Bottom Box (Saved by default) */}
    <View style={[
      styles.bottomBox,
      { backgroundColor: activeView === 'friends' ? '#AE8F72' : '#C8A688' }
    ]}>
      {Platform.OS === 'ios' ? (
        <Animated.View style={[bottomBoxAnimatedStyle, { flex: 1, borderRadius: 41 }]}>
          <BottomBoxContent 
            activeView={activeView}
            handleBottomBoxPressIn={handleBottomBoxPressIn}
            handleBottomBoxPressOut={handleBottomBoxPressOut}
            renderItem={renderItem}
            savedItems={savedItems}
            friendItems={friendItems}
            handleNavigate={handleNavigate}
          />
        </Animated.View>
      ) : (
        <View style={{ flex: 1, borderRadius: 41 }}>
          <BottomBoxContent 
            activeView={activeView}
            handleBottomBoxPressIn={handleBottomBoxPressIn}
            handleBottomBoxPressOut={handleBottomBoxPressOut}
            renderItem={renderItem}
            savedItems={savedItems}
            friendItems={friendItems}
            handleNavigate={handleNavigate}
          />
        </View>
      )}
    </View>
  </>
  );
};

// Extracted component for bottom box content to reduce render complexity
const BottomBoxContent = ({
  activeView,
  handleBottomBoxPressIn,
  handleBottomBoxPressOut,
  renderItem,
  savedItems,
  friendItems,
  handleNavigate
}: BottomBoxContentProps) => {
  console.log('BottomBoxContent - activeView:', activeView);
  
  // FOR BOTTOM BOX: If top shows friends, bottom shows saved (and vice versa)
  // This ensures the bottom box always shows the OPPOSITE of what's in the top box
  const dataToShow = activeView === 'friends' ? savedItems : friendItems;
  console.log('BottomBoxContent - showing items:', dataToShow.map(item => item.name));
  
  return (
  <Pressable 
    style={styles.bottomBoxContent} 
    onPressIn={handleBottomBoxPressIn}
    onPressOut={handleBottomBoxPressOut}
  >
    <FlatList
      data={dataToShow.slice(0, 2)}
      renderItem={({ item, index }) => {
        // Force the correct "isSavedItem" value based on what's showing in this box
        // If we're showing saved items in bottom box (when friends are in top)
        const isSavedItem = activeView === 'friends';
        console.log(`Bottom box item ${item.name}, isSavedItem forced to: ${isSavedItem}`);
        
        // Simple static rendering for Android
        if (!USE_ANIMATIONS) {
          return (
            <View style={styles.itemWrapper}>
              <View style={styles.itemContainer}>
                <Pressable 
                  style={styles.imageContainer}
                  onPress={() => {
                    console.log(`Bottom box item pressed: ${item.name}, isSavedItem: ${isSavedItem}`);
                    if (isSavedItem) {
                      // Only saved items navigate with params
                      console.log('Navigating with saved item from bottom box:', item);
                      handleNavigate('Home', item, true);
                    } else {
                      // Friend items do nothing
                      console.log('Friend item pressed in bottom box - doing nothing');
                    }
                  }}
                >
                  <Image source={item.image} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.itemPrice}>{item.price}</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          );
        }
        
        // More complex animations for iOS
        return (
          <View style={styles.itemWrapper}>
            <Animated.View
              entering={FadeInDown.duration(400).delay(100 + index * 50)}
              exiting={FadeOutDown.duration(50)}
            >
              <View style={styles.itemContainer}>
                <Pressable 
                  style={styles.imageContainer}
                  onPress={() => {
                    console.log(`Bottom box item pressed: ${item.name}, isSavedItem: ${isSavedItem}`);
                    if (isSavedItem) {
                      // Only saved items navigate with params
                      console.log('Navigating with saved item from bottom box:', item);
                      handleNavigate('Home', item, true);
                    } else {
                      // Friend items do nothing
                      console.log('Friend item pressed in bottom box - doing nothing');
                    }
                  }}
                >
                  <Image source={item.image} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.itemPrice}>{item.price}</Text>
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        );
      }}
      keyExtractor={item => item.id.toString()}
      showsVerticalScrollIndicator={false}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.previewListContent}
      scrollEnabled={false}
      removeClippedSubviews={Platform.OS === 'android'} // Android optimization
      maxToRenderPerBatch={2} // Keep it small
    />
    <Text style={styles.boxTitle}>
      {activeView === 'friends' ? 'СОХРАНЁНКИ' : 'ДРУЗЬЯ'}
    </Text>
  </Pressable>
  );
};

// Extracted search content component
const SearchContent = ({ 
  searchQuery, 
  handleSearch, 
  toggleSearch, 
  filteredFriends, 
  renderSearchItem 
}: SearchContentProps) => (
  <>
    {/* Search Input */}
    <View style={styles.searchContainer}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск"
          placeholderTextColor="rgba(0,0,0,0.6)"
          value={searchQuery}
          onChangeText={handleSearch}
          autoFocus={true}
        />
        <Pressable 
          style={styles.cancelButton}
          onPress={toggleSearch}
        >
          <Text style={styles.cancelButtonText}>Отмена</Text>
        </Pressable>
      </View>
    </View>

    {/* Search Results */}
    <View style={styles.searchResultsBox}>
      <View style={{ flex: 1 }}>
        {searchQuery.length === 0 ? (
          <Text style={styles.noResultsText}>Начните искать</Text>
        ) : (filteredFriends.length === 0 ? (
          <Text style={styles.noResultsText}>No results found</Text>
        ) : (
          <FlatList
            style={styles.flatList}
            data={filteredFriends}
            renderItem={renderSearchItem}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews={Platform.OS === 'android'} // Android optimization
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={5}
          />
        ))}
      </View>
    </View>
    
    {/* Shrunken Top Box */}
    <View style={[
      styles.topBox,
      styles.searchModeTopBox,
      { backgroundColor: '#C8A688' }
    ]}>
      <View style={styles.titleRow}>
        <Text style={styles.boxTitle}>
          ДРУЗЬЯ
        </Text>
        <Pressable onPress={toggleSearch} style={styles.plusIconContainer}>
          <PlusSvg width={24} height={24} fill="#FFF" />
        </Pressable>
      </View>
    </View>
  </>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
    //backgroundColor: '#FFFFFF', // Add background color
  },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'REM',
    fontSize: 18,
    color: '#4A3120',
  },
  topBox: {
    position: 'absolute',
    zIndex: 5,
    width: '88%',
    height: Platform.OS === 'ios' ? height * 0.67 : height * 0.66,
    left: '6%',
    top: Platform.OS === 'ios' ? height * 0.035 : height * 0.052,
    borderRadius: 41,
    //padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  flatList: {
    width: '100%',
    height: '100%',
    padding: 15,
    borderRadius: 41,
  },
  searchModeTopBox: {
    height: height * 0.65,
    top: Platform.OS === 'ios' ? height * 0.145 : height * 0.166,
    //bottom: Platform.OS === 'ios' ? height*0.0 : '2%',
    zIndex: 1, // Lower z-index to position behind search results
    justifyContent: 'flex-end',
  },
  bottomBox: {
    position: 'absolute',
    width: '88%',
    height: height * 0.75,
    left: '6%',
    top: Platform.OS === 'ios' ? height * 0.035 : height * 0.052,
    borderRadius: 41,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 2,
    overflow: 'hidden',
  },
  searchModeBottomBox: {
    height: height * 0.65,
    bottom: Platform.OS === 'ios' ? height * 0.02 : height * 0.035,
    zIndex: 1, // Lower z-index in search mode
  },
  bottomBoxContent: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 15
  },
  boxTitle: {
    fontFamily: 'IgraSans',
    fontSize: 38,
    color: '#FFF',
    marginTop: 5,
    marginLeft: 10,
    textAlign: 'left',
  },
  plusIconContainer: {
    padding: 5,
    marginBottom: Platform.OS === 'ios' ? 0 : -10,
  },
  listContent: {
    paddingBottom: 20,
  },
  previewListContent: {
    paddingBottom: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  itemContainer: {
    width: (width * 0.88 - 40) / 2, // Calculate width for two columns with spacing
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    backgroundColor: '#EDE7E2',
    borderRadius: 30,
  },
  searchItem: {
    width: '100%',
    marginBottom: 17,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    backgroundColor: '#EDE7E2',
    borderRadius: 30,
  },
  imageContainer: {
    overflow: 'hidden',
    aspectRatio: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  itemImage: {
    width: '73%',
    height: '73%',
    resizeMode: 'contain',
  },
  itemInfo: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 6,
  },
  itemName: {
    fontFamily: 'IgraSans',
    fontSize: 13,
    color: '#4A3120',
    textAlign: 'center',
  },
  priceContainer: {
    position: 'absolute',
    right: -25,
    top: '50%',
    transform: [{ translateY: -20 }, { rotate: '90deg' }],
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  itemPrice: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#4A3120',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '88%',
    left: '6%',
    minHeight: height*0.1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    backgroundColor: '#F2ECE7',
    borderRadius: 41,
    zIndex: 10,
    position: 'absolute',
    top: Platform.OS === 'ios' ? height * 0.02 : height * 0.04,
  },
  searchInput: {
    flex: 1,
    padding: 15,
    fontSize: 30,
    fontFamily: 'Igra Sans',
    height: '100%'
  },
  cancelButton: {
    paddingHorizontal: Platform.OS === 'ios' ? 45 : 50, // Smaller padding on Android
    backgroundColor: '#C8A688',
    borderRadius: 41,
    paddingVertical: Platform.OS === 'ios' ? 34 : 27, // Smaller on Android
  },
  cancelButtonText: {
    fontFamily: 'Igra Sans',
    fontSize: 18,
    color: '#4A3120',
  },
  searchResultsBox: {
    position: 'absolute',
    left: '6%',
    top: Platform.OS === 'ios' ? height * 0.146 : height * 0.166,
    zIndex: 8,
    width: '88%',
    height: Platform.OS === 'ios' ? height * 0.57 : height * 0.56,
    borderRadius: 41,
    //padding: 15,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  noResultsText: {
    fontFamily: 'REM',
    fontSize: 16,
    color: '#4A3120',
    textAlign: 'center',
    marginTop: 20,
  },
  itemWrapper: {
    width: (width * 0.88 - 40) / 2, // Match parent container width
    marginBottom: 15,
  },
  searchItemWrapper: {
    width: '47%',
    marginBottom: 17,
  },
});

export default Favorites;