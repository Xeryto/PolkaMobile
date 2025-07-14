import React, { useState, useEffect, useRef, memo } from 'react';
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
  InteractionManager,
  TouchableOpacity,
  Animated as RNAnimated,
  Easing as RNEasing,
  ListRenderItem,
  ListRenderItemInfo,
  FlexAlignType,
  FlexStyle,
  Alert
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeOutDown,
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  cancelAnimation,
  FadeOut
} from 'react-native-reanimated';
import PlusSvg from './assets/Plus.svg';
import BackIcon from './assets/Back.svg';
import CheckIcon from './assets/Check.svg';
import CancelIcon from './assets/CancelThin.svg';
import CancelThickIcon from './assets/Cancel.svg';
import PlusIcon from './assets/PlusBlack.svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as api from './services/api';

// Define a simpler navigation type that our custom navigation can satisfy
interface SimpleNavigation {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  addListener?: (event: string, callback: () => void) => () => void;
}

interface FavoritesProps {
  navigation: SimpleNavigation;
}

// Interface for saved items with price
interface FavoriteItem {
  id: number;
  name: string;
  price: string;
  image: any;
}

// Updated interface for friend items to match API response
interface FriendItem {
  id: string;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  status: 'friend' | 'request_received' | 'request_sent' | 'not_friend';
  requestId?: string; // For friend requests
}

// Interface for friend request items
interface FriendRequestItem {
  id: string;
  username: string;
  avatar_url?: string | null;
  requestId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// Interface for recommended items for friends
interface RecommendedItem {
  id: number;
  name: string;
  price: string;
  image: any;
  isLiked?: boolean;
}

interface UserActionButtonProps {
  status: FriendItem['status'];
  onAddFriend?: () => void;
  onCancelRequest?: () => void;
  onAcceptRequest?: () => void;
  onRejectRequest?: () => void;
  onRemoveFriend?: () => void;
  styles: any;
  width: number;
}

const { width, height } = Dimensions.get('window');

// Use platform-specific animation configs
const ANIMATION_CONFIG = {
  duration: Platform.OS === 'ios' ? 400 : 300, // Faster on Android
  easing: Easing.bezier(0.25, 0.1, 0.25, 1)
};

// Disable complex animations on Android for better performance
const USE_ANIMATIONS = Platform.OS === 'ios';

// UserActionButton: renders the correct action button for a user status
const UserActionButton = memo(({
  status,
  onAddFriend,
  onCancelRequest,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  styles,
  width
}: UserActionButtonProps) => {
  // Button container style for non-overlay buttons
  const buttonContainerStyle = {
    width: width * 0.15,
    height: width * 0.15,
    justifyContent: 'center' as FlexStyle['justifyContent'],
    alignItems: 'center' as FlexAlignType,
  };

  if (status === 'friend') {
    // This is an overlay button. Return it without the container so it doesn't affect the layout.
    return (
      <TouchableOpacity style={styles.removeFriendButton} onPress={onRemoveFriend}>
        <CancelThickIcon />
      </TouchableOpacity>
    );
  }

  // For all other statuses, the button is part of the layout flow, so it needs the container.
  const otherButtons = (
    <>
      {status === 'request_received' && (
        <View style={styles.stackedButtonsContainer}>
          <TouchableOpacity style={[styles.stackedButton, styles.acceptButton]} onPress={onAcceptRequest}>
            <CheckIcon width={width * 0.1} height={width * 0.1} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.stackedButton, styles.rejectButton]} onPress={onRejectRequest}>
            <CancelIcon width={width * 0.12} height={width * 0.12} />
          </TouchableOpacity>
        </View>
      )}
      {status === 'not_friend' && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <TouchableOpacity style={[styles.addFriendButton, styles.stackedButton]} onPress={onAddFriend}>
            <PlusIcon />
          </TouchableOpacity>
        </Animated.View>
      )}
      {status === 'request_sent' && (
        <Animated.View entering={FadeInDown.duration(300)}>
          <TouchableOpacity style={[styles.stackedButton, styles.rejectButton, styles.cancelRequestButton]} onPress={onCancelRequest}>
            <Text style={styles.cancelRequestText}>Отменить заявку</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </>
  );

  return (
    <View style={buttonContainerStyle}>
      {otherButtons}
    </View>
  );
});

const Favorites = ({ navigation }: FavoritesProps) => {
  // Basic state
  const [activeView, setActiveView] = useState<'friends' | 'saved'>('friends');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(true);
  const [isReady, setIsReady] = useState(false); // Control initial render
  const [selectedFriend, setSelectedFriend] = useState<FriendItem | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [customRecommendations, setCustomRecommendations] = useState<{[key: string]: RecommendedItem[]}>({});

  // Friend data state
  const [friendItems, setFriendItems] = useState<FriendItem[]>([]);
  const [sentRequests, setSentRequests] = useState<api.FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<api.FriendRequest[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [searchResults, setSearchResults] = useState<FriendItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [mainPendingRemoval, setMainPendingRemoval] = useState<FriendItem | null>(null);
  const [mainShowConfirmDialog, setMainShowConfirmDialog] = useState(false);
  const [searchPendingRemoval, setSearchPendingRemoval] = useState<FriendItem | null>(null);
  const [searchShowConfirmDialog, setSearchShowConfirmDialog] = useState(false);
  
  // Opacity values for the main view and search view
  const mainViewOpacity = useSharedValue(1);
  const searchViewOpacity = useSharedValue(0);
  const profileViewOpacity = useSharedValue(0);
  
  // Animation value for press animation
  const pressAnimationScale = useSharedValue(1);

  // Load friends and requests on component mount
  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      setIsLoadingFriends(true);
      
      // Load friends, sent requests, and received requests in parallel
      const [friends, sent, received] = await Promise.all([
        api.getFriends(),
        api.getSentFriendRequests(),
        api.getReceivedFriendRequests()
      ]);

      console.log('API Response - Friends:', friends);
      console.log('API Response - Sent Requests:', sent);
      console.log('API Response - Received Requests:', received);

      // Convert API friends to FriendItem format
      const friendsList: FriendItem[] = friends.map(friend => ({
        ...friend,
        status: 'friend' as const
      }));

      // Convert sent requests to FriendItem format
      const sentRequestsList: FriendItem[] = sent
        .filter(request => request.status === 'pending')
        .map(request => ({
          id: request.recipient?.id || '',
          username: request.recipient?.username || '',
          email: '',
          status: 'request_sent' as const,
          requestId: request.id
        }));

      // Convert received requests to FriendItem format
      const receivedRequestsList: FriendItem[] = received
        .filter(request => request.status === 'pending')
        .map(request => ({
          id: request.sender?.id || '',
          username: request.sender?.username || '',
          email: '',
          status: 'request_received' as const,
          requestId: request.id
        }));

      const allFriendItems = [...friendsList, ...sentRequestsList, ...receivedRequestsList];
      console.log('Processed Friend Items:', allFriendItems);

      setFriendItems(allFriendItems);
      setSentRequests(sent);
      setReceivedRequests(received);
    } catch (error) {
      console.error('Error loading friends data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить список друзей');
    } finally {
      setIsLoadingFriends(false);
    }
  };

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

  // Sample recommended items for friends
  const recommendedItems: { [key: string]: RecommendedItem[] } = {
    'friend1': [
      { id: 101, name: 'Для друга 1 - Рек. 1', price: '15 000 р', image: require('./assets/Vision.png') },
      { id: 102, name: 'Для друга 1 - Рек. 2', price: '20 000 р', image: require('./assets/Vision2.png') },
      { id: 103, name: 'Для друга 1 - Рек. 3', price: '18 000 р', image: require('./assets/Vision.png') },
      { id: 104, name: 'Для друга 1 - Рек. 4', price: '22 000 р', image: require('./assets/Vision2.png') },
    ],
    'friend2': [
      { id: 201, name: 'Для друга 2 - Рек. 1', price: '25 000 р', image: require('./assets/Vision2.png') },
      { id: 202, name: 'Для друга 2 - Рек. 2', price: '19 000 р', image: require('./assets/Vision.png') },
      { id: 203, name: 'Для друга 2 - Рек. 3', price: '21 000 р', image: require('./assets/Vision2.png') },
      { id: 204, name: 'Для друга 2 - Рек. 4', price: '17 000 р', image: require('./assets/Vision.png') },
    ],
  };
  
  // Animated styles for views
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

  const profileViewAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: profileViewOpacity.value,
    display: profileViewOpacity.value === 0 ? 'none' : 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
      cancelAnimation(profileViewOpacity);
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
      profileViewOpacity.value = withTiming(0, ANIMATION_CONFIG);
    } else {
      // Fade in main view, fade out search view
      mainViewOpacity.value = withTiming(1, ANIMATION_CONFIG);
      searchViewOpacity.value = withTiming(0, ANIMATION_CONFIG);
      // Don't change profile view here
    }
  }, [isSearchActive, isMounted]);

  // Handle friend profile view
  useEffect(() => {
    if (!isMounted) return;
    
    if (selectedFriend) {
      // Fade out main view, fade in profile view
      mainViewOpacity.value = withTiming(0, ANIMATION_CONFIG);
      profileViewOpacity.value = withTiming(1, ANIMATION_CONFIG);
      searchViewOpacity.value = withTiming(0, ANIMATION_CONFIG);
    } else {
      // Fade in main view, fade out profile view
      mainViewOpacity.value = withTiming(1, ANIMATION_CONFIG);
      profileViewOpacity.value = withTiming(0, ANIMATION_CONFIG);
      // Don't change search view here
    }
  }, [selectedFriend, isMounted]);

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
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    
    if (text.length >= 2) {
      setIsSearching(true);
      try {
        // Use real API to search for users
        const searchResults = await api.searchUsers(text);
        
        // Convert search results to FriendItem format with real friend_status
        const searchUsersList: FriendItem[] = searchResults.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          status: user.friend_status || 'not_friend'
        }));
        
        setSearchResults(searchUsersList);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
        Alert.alert('Ошибка', 'Не удалось выполнить поиск пользователей');
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Toggle search mode
  const toggleSearch = () => {
    setIsSearchActive(!isSearchActive);
    if (!isSearchActive) {
      setSearchQuery('');
      setSearchResults([]); // Clear search results when exiting search
    }
  };

  // Handle friend selection
  const handleFriendSelect = (friend: FriendItem) => {
    console.log(`Friend selected: ${friend.username}`);
    setSelectedFriend(friend);
  };

  // Handle back from friend profile
  const handleBackFromProfile = () => {
    setSelectedFriend(null);
  };

  // Handle regenerate recommendations
  const handleRegenerateRecommendations = () => {
    // Only proceed if a friend is selected
    if (!selectedFriend) return;

    console.log('Regenerating recommendations for', selectedFriend.username);
    
    // Show loading indicator
    setIsRegenerating(true);

    // Simulate API call with a delay
    setTimeout(() => {
      // Generate new recommendations (in a real app, this would be from an API)
      const shuffledItems = [...recommendedItems[selectedFriend.id]];
      
      // Shuffle the array to simulate new recommendations
      for (let i = shuffledItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
      }
      
      // Add some randomness to the prices to make them look different
      const newRecommendations = shuffledItems.map(item => ({
        ...item,
        id: item.id + 1000, // Make sure IDs are unique
        price: `${Math.floor(Math.random() * 30 + 15)} 000 р`
      }));
      
      // Update the recommendations
      setCustomRecommendations({
        ...customRecommendations,
        [selectedFriend.id]: newRecommendations
      });
      
      // Hide loading indicator
      setIsRegenerating(false);
    }, 1000); // 1 second delay to simulate network request
  };

  // Simulate API call to check if an item is liked by the user
  const checkItemLikedStatus = (itemId: number): Promise<boolean> => {
    return new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        console.log(`API - Checking if item ${itemId} is liked`);
        
        // In a real app, this would send a request to the server
        // to check if the current user has this item in their likes
        // For now, we'll simulate a random result or return false
        const isLiked = false; // Default to not liked for recommended items
        
        console.log(`API - Item ${itemId} liked status: ${isLiked}`);
        resolve(isLiked);
      }, 200); // 200ms delay to simulate network
    });
  };

  // Improved navigation handler with animation cleanup - now with item data passing
  const handleNavigate = (screen: string, params?: any, fromFavorites: boolean = false) => {
    setIsMounted(false);
    // Use a shorter timeout on Android
    const delay = Platform.OS === 'ios' ? 50 : 0;
    setTimeout(() => {
      if (fromFavorites && params && screen === 'Home') {
        // Convert the saved item to a card item format and pass it
        const navigationParams = { 
          addCardItem: {
            id: params.id,
            name: params.name,
            price: params.price,
            image: params.image,
            isLiked: params.isLiked // Pass the isLiked property, which may be undefined
          }
        };
        console.log('NAVIGATING TO HOME WITH PARAMS:', navigationParams);
        navigation.navigate(screen, navigationParams);
      } else if (screen === 'Home') {
        console.log('NAVIGATING TO HOME WITHOUT PARAMS');
        navigation.navigate(screen);
      } else {
        console.log('NAVIGATING TO:', screen);
        navigation.navigate(screen);
      }
    }, delay);
  };

  // Real API functions for friend actions
  const acceptFriendRequest = async (requestId: string) => {
    console.log(`Accepting friend request ${requestId}...`);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await api.acceptFriendRequest(requestId);
      
      // Reload friends data to reflect changes
      await loadFriendsData();
      
      Alert.alert('Успех', 'Заявка в друзья принята');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Ошибка', 'Не удалось принять заявку в друзья');
    }
  };
  
  const rejectFriendRequest = async (requestId: string) => {
    console.log(`Rejecting friend request ${requestId}...`);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      await api.rejectFriendRequest(requestId);
      
      // Reload friends data to reflect changes
      await loadFriendsData();
      
      Alert.alert('Успех', 'Заявка в друзья отклонена');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Ошибка', 'Не удалось отклонить заявку в друзья');
    }
  };
  
  const sendFriendRequest = async (username: string) => {
    console.log(`Sending friend request to user ${username}...`);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      await api.sendFriendRequest(username);
      
      // Reload friends data to reflect changes
      await loadFriendsData();
      
      Alert.alert('Успех', 'Заявка в друзья отправлена');
    } catch (error) {
      console.error('Error sending friend request:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Ошибка', 'Не удалось отправить заявку в друзья');
    }
  };
  
  const cancelFriendRequest = async (requestId: string) => {
    console.log(`Cancelling friend request ${requestId}...`);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      await api.cancelFriendRequest(requestId);
      
      // Reload friends data to reflect changes
      await loadFriendsData();
      
      Alert.alert('Успех', 'Заявка в друзья отменена');
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Ошибка', 'Не удалось отменить заявку в друзья');
    }
  };

  // Remove friend function (this would need a DELETE /api/v1/friends/{friend_id} endpoint)
  const removeFriend = async (friendId: string) => {
    console.log(`Removing friend ${friendId}...`);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      // Note: This endpoint doesn't exist in the API spec provided
      // You would need to add: DELETE /api/v1/friends/{friend_id}
      // await api.removeFriend(friendId);
      
      // For now, just reload data
      await loadFriendsData();
      
      setMainShowConfirmDialog(false);
      setMainPendingRemoval(null);
      
      Alert.alert('Успех', 'Друг удален из списка');
    } catch (error) {
      console.error('Error removing friend:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Ошибка', 'Не удалось удалить друга');
    }
  };

  // 1. Move extra search users to state
  const [searchMockUsers, setSearchMockUsers] = useState<FriendItem[]>([
    { 
      id: 'search1', 
      username: 'searchuser1', 
      email: 'search1@example.com',
      status: 'not_friend' 
    },
    { 
      id: 'search2', 
      username: 'searchuser2', 
      email: 'search2@example.com',
      status: 'not_friend' 
    },
  ]);

  // 2. Update filteredFriends to only use search results from API
  const filteredFriends = searchQuery.length >= 2 ? searchResults : [];

  // Render a saved item
  const renderSavedItem: ListRenderItem<FavoriteItem> = ({ item, index, separators }) => {
    // Simple static rendering for Android
    if (!USE_ANIMATIONS) {
      return (
        <View style={styles.itemWrapper}>
          <View style={styles.itemContainer}>
            <Pressable 
              style={styles.itemImageContainer}
              onPress={() => {
                console.log(`Saved item pressed: ${item.name}`);
                // Navigate with saved item
                handleNavigate('Home', item, true);
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
          entering={FadeInDown.duration(300).delay(100 + index * 50)}
          exiting={FadeOutDown.duration(50)}
        >
          <View style={styles.itemContainer}>
            <Pressable 
              style={styles.itemImageContainer}
              onPress={() => {
                console.log(`Saved item pressed: ${item.name}`);
                // Navigate with saved item
                handleNavigate('Home', item, true);
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

  // Replace renderFriendItem
  const renderFriendItem: ListRenderItem<FriendItem> = ({ item, index }) => {
    if (mainPendingRemoval && mainShowConfirmDialog && mainPendingRemoval.id === item.id) {
      return (
        <View style={styles.itemWrapper}>
          <View style={styles.itemContainer}>
            <View style={styles.confirmationContainer}>
              <Text style={styles.confirmationText}>Подтвердить удаление из друзей?</Text>
              <View style={styles.confirmationButtons}>
                <TouchableOpacity style={[styles.confirmButton, styles.confirmYesButton]} onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  removeFriend(item.id);
                  setMainShowConfirmDialog(false);
                  setMainPendingRemoval(null);
                }}>
                  <Text style={styles.confirmButtonText}>Да</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmButton, styles.confirmNoButton]} onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMainShowConfirmDialog(false);
                  setMainPendingRemoval(null);
                }}>
                  <Text style={styles.confirmButtonText}>Нет</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }
    const handleAcceptRequest = async () => {
      if (item.status === 'request_received' && item.requestId) {
        await acceptFriendRequest(item.requestId);
      }
    };
    const handleRejectRequest = async () => {
      if (item.status === 'request_received' && item.requestId) {
        await rejectFriendRequest(item.requestId);
      }
    };
    return (
      <FriendListItem
        item={item}
        onAddFriend={() => sendFriendRequest(item.username)}
        onCancelRequest={() => item.requestId && cancelFriendRequest(item.requestId)}
        onAcceptRequest={handleAcceptRequest}
        onRejectRequest={handleRejectRequest}
        onRemoveFriend={() => {
          setMainPendingRemoval(item);
          setMainShowConfirmDialog(true);
        }}
        onPress={() => {
          handleFriendSelect(item);
        }}
        styles={styles}
        width={width}
      />
    );
  };

  // Render a recommended item
  const renderRecommendedItem: ListRenderItem<RecommendedItem> = ({ item, index, separators }) => {
    // Simple static rendering for Android
    if (!USE_ANIMATIONS) {
      return (
        <View style={[styles.itemWrapper, {width: (width * 0.88 - 45) / 2}]}>
          <View style={styles.itemContainer}>
            <Pressable 
              style={styles.itemImageContainer}
              onPress={() => {
                console.log(`Recommended item pressed: ${item.name}`);
                
                // Check liked status with API before navigating
                checkItemLikedStatus(item.id)
                  .then(isLiked => {
                    // Update the item with the liked status from the API
                    const itemWithLikeStatus = {
                      ...item,
                      isLiked: isLiked
                    };
                    
                    // Navigate to main page with the recommended item and its like status
                    handleNavigate('Home', itemWithLikeStatus, true);
                  })
                  .catch(error => {
                    console.error('Error checking like status:', error);
                    // If there's an error, navigate with the original item
                    handleNavigate('Home', item, true);
                  });
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
      <View style={[styles.itemWrapper, {width: (width * 0.88 - 45) / 2}]}>
        <Animated.View
          entering={FadeInDown.duration(300).delay(100 + index * 50)}
          exiting={FadeOutDown.duration(50)}
        >
          <View style={styles.itemContainer}>
            <Pressable 
              style={styles.itemImageContainer}
              onPress={() => {
                console.log(`Recommended item pressed: ${item.name}`);
                
                // Check liked status with API before navigating
                checkItemLikedStatus(item.id)
                  .then(isLiked => {
                    // Update the item with the liked status from the API
                    const itemWithLikeStatus = {
                      ...item,
                      isLiked: isLiked
                    };
                    
                    // Navigate to main page with the recommended item and its like status
                    handleNavigate('Home', itemWithLikeStatus, true);
                  })
                  .catch(error => {
                    console.error('Error checking like status:', error);
                    // If there's an error, navigate with the original item
                    handleNavigate('Home', item, true);
                  });
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

  // Custom render function for search results that includes user status
  const renderSearchUser: ListRenderItem<any> = ({ item, index, separators }) => {
    if (searchPendingRemoval && searchShowConfirmDialog && searchPendingRemoval.id === item.id) {
      return (
        <View style={styles.searchItemWrapper}>
          <View style={styles.itemContainer}>
            <View style={styles.confirmationContainer}>
              <Text style={styles.confirmationText}>Подтвердить удаление из друзей?</Text>
              <View style={styles.confirmationButtons}>
                <TouchableOpacity 
                  style={[styles.confirmButton, styles.confirmYesButton]} 
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    removeFriend(item.id);
                    setSearchShowConfirmDialog(false);
                    setSearchPendingRemoval(null);
                  }}
                >
                  <Text style={styles.confirmButtonText}>Да</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmButton, styles.confirmNoButton]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSearchShowConfirmDialog(false);
                    setSearchPendingRemoval(null);
                  }}
                >
                  <Text style={styles.confirmButtonText}>Нет</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    }
    const handleAcceptRequest = async () => {
      if (item.status === 'request_received' && item.requestId) {
        await acceptFriendRequest(item.requestId);
      }
    };

    const handleRejectRequest = async () => {
      if (item.status === 'request_received' && item.requestId) {
        await rejectFriendRequest(item.requestId);
      }
    };

    return (
      <View style={styles.searchItemWrapper}>
        <View style={styles.itemContainer}>
          <Pressable 
            style={styles.userImageContainer}
            onPress={() => {
              console.log(`Friend item pressed: ${item.username}`);
              handleFriendSelect(item);
            }}
          >
            <View style={styles.imageContainer}>
              <Image source={require('./assets/Vision.png')} style={styles.userImage} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.itemName} numberOfLines={1}>@{item.username}</Text>
            </View>
          </Pressable>
          {item.status === 'friend' ? (
            <TouchableOpacity 
              style={styles.removeFriendButton}
              onPress={() => {
                setSearchPendingRemoval(item);
                setSearchShowConfirmDialog(true);
              }}
            >
              <CancelThickIcon />
            </TouchableOpacity>
          ) : item.status === 'request_received' ? (
            <View style={styles.stackedButtonsContainer}>
              <TouchableOpacity 
                style={[styles.stackedButton, styles.acceptButton]}
                onPress={handleAcceptRequest}
              >
                <CheckIcon width={width * 0.1} height={width * 0.1} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.stackedButton, styles.rejectButton]}
                onPress={handleRejectRequest}
              >
                <CancelIcon width={width * 0.12} height={width * 0.12} />
              </TouchableOpacity>
            </View>
          ) : item.status === 'not_friend' ? (
            <View style={styles.buttonContainerStyle}>
              <TouchableOpacity 
                style={[styles.addFriendButton, styles.stackedButton]}
                onPress={() => sendFriendRequest(item.username)}
              >
                <PlusIcon/>
              </TouchableOpacity>
            </View>
          ) : item.status === 'request_sent' ? (
            <View style={styles.buttonContainerStyle}>
              <Animated.View entering={FadeInDown.duration(300)}>
                <TouchableOpacity 
                  style={[styles.stackedButton, styles.rejectButton, styles.cancelRequestButton]}
                  onPress={() => item.requestId && cancelFriendRequest(item.requestId)}
                >
                  <Text style={styles.cancelRequestText}>Отменить заявку</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          ) : null}
        </View>
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
    
    // Toggle the view without an explicit button
    toggleView();
  };

  // Get the recommendations for the selected friend, preferring custom recommendations if available
  const getRecommendationsForFriend = (friendId: string): RecommendedItem[] => {
    if (customRecommendations[friendId] && customRecommendations[friendId].length > 0) {
      return customRecommendations[friendId];
    }
    return recommendedItems[friendId] || [];
  };

  // Helper function to update user status in search results
  const setSearchUserStatus = (userId: string, status: FriendItem['status']) => {
    setSearchMockUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, status } : user
    ));
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

  // Show loading state for friends
  if (isLoadingFriends) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Загрузка друзей...</Text>
        </View>
      </View>
    );
  }

  // Simplified render method
  return (
    <View style={styles.container}>
      {!isReady ? (
        // Simple loading screen until heavy animations are ready
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <>
          {/* Main Content (visible by default) */}
          <Animated.View style={mainViewAnimatedStyle}>
            <MainContent 
              activeView={activeView}
              toggleSearch={toggleSearch}
              handleBottomBoxPressIn={handleBottomBoxPressIn}
              handleBottomBoxPressOut={handleBottomBoxPressOut}
              bottomBoxAnimatedStyle={bottomBoxAnimatedStyle}
              renderSavedItem={renderSavedItem}
              renderFriendItem={renderFriendItem}
              savedItems={savedItems}
              friendItems={friendItems}
              onAcceptRequest={acceptFriendRequest}
              onRejectRequest={rejectFriendRequest}
              handleNavigate={handleNavigate}
            />
          </Animated.View>
          
          {/* Search Content (hidden by default) */}
          <Animated.View style={searchViewAnimatedStyle}>
            <SearchContent 
              searchQuery={searchQuery}
              handleSearch={handleSearch}
              toggleSearch={toggleSearch}
              filteredFriends={filteredFriends as any[]}
              renderSearchUser={renderSearchUser as any}
              onSendFriendRequest={sendFriendRequest}
              onRemoveFriend={(friendId) => {
                const friend = friendItems.find(f => f.id === friendId);
                if (friend) {
                  setSearchPendingRemoval(friend);
                  setSearchShowConfirmDialog(true);
                }
              }}
              pendingRemoval={searchPendingRemoval}
              showConfirmDialog={searchShowConfirmDialog}
              setShowConfirmDialog={setSearchShowConfirmDialog}
              setPendingRemoval={setSearchPendingRemoval}
              removeFriend={removeFriend}
            />
          </Animated.View>

          {/* Friend Profile View (hidden by default) */}
          <Animated.View style={profileViewAnimatedStyle}>
            {selectedFriend && (
              <FriendProfileView
                key={`friend-profile-${selectedFriend.id}`}
                friend={selectedFriend}
                onBack={handleBackFromProfile}
                recommendedItems={getRecommendationsForFriend(selectedFriend.id)}
                renderRecommendedItem={renderRecommendedItem}
                onRegenerate={handleRegenerateRecommendations}
                isRegenerating={isRegenerating}
              />
            )}
          </Animated.View>
        </>
      )}
    </View>
  );
};

// Define the interfaces for our extracted components
interface MainContentProps {
  activeView: 'friends' | 'saved';
  toggleSearch: () => void;
  handleBottomBoxPressIn: () => void;
  handleBottomBoxPressOut: () => void;
  bottomBoxAnimatedStyle: any;
  renderSavedItem: ListRenderItem<FavoriteItem>;
  renderFriendItem: ListRenderItem<FriendItem>;
  savedItems: FavoriteItem[];
  friendItems: FriendItem[];
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  handleNavigate: (screen: string, params?: any, fromFavorites?: boolean) => void;
}

interface BottomBoxContentProps {
  activeView: 'friends' | 'saved';
  handleBottomBoxPressIn: () => void;
  handleBottomBoxPressOut: () => void;
  renderSavedItem: ListRenderItem<FavoriteItem>;
  renderFriendItem: ListRenderItem<FriendItem>;
  savedItems: FavoriteItem[];
  friendItems: FriendItem[];
  handleNavigate: (screen: string, params?: any, fromFavorites?: boolean) => void;
}

interface SearchContentProps {
  searchQuery: string;
  handleSearch: (text: string) => void;
  toggleSearch: () => void;
  filteredFriends: any[];
  renderSearchUser: ListRenderItem<any>;
  onSendFriendRequest: (userId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  pendingRemoval: FriendItem | null;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  setPendingRemoval: (friend: FriendItem | null) => void;
  removeFriend: (friendId: string) => void;
}

// Extracted component for main content to reduce render complexity
const MainContent = ({ 
  activeView, 
  toggleSearch, 
  handleBottomBoxPressIn, 
  handleBottomBoxPressOut,
  bottomBoxAnimatedStyle,
  renderSavedItem,
  renderFriendItem,
  savedItems,
  friendItems,
  onAcceptRequest,
  onRejectRequest,
  handleNavigate
}: MainContentProps) => {
  return (
  <>
    {/* Top Box (Friends by default) */}
    <Animated.View style={[
      styles.topBox,
      { backgroundColor: activeView === 'friends' ? '#C8A688' : '#AE8F72' }
    ]}
    entering={FadeInDown.duration(500).delay(200)}
    //exiting={FadeOutDown.duration(50)}
    >
      <View style={{ flex: 1, borderRadius: 41 }}>
        {activeView === 'friends' && (
          <>
            
            
            {/* Friends List */}
            <FlatList<FriendItem>
              style={styles.flatList}
              data={friendItems}
              renderItem={renderFriendItem}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
              removeClippedSubviews={Platform.OS === 'android'} // Optimize memory usage on Android
              initialNumToRender={4} // Only render what's visible initially
              maxToRenderPerBatch={4} // Limit batch size for smoother scrolling
              windowSize={5} // Reduce window size for performance
            />
          </>
        )}
        
        {activeView === 'saved' && (
          <FlatList<FavoriteItem>
            style={styles.flatList}
            data={savedItems}
            renderItem={renderSavedItem}
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
        )}
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
    </Animated.View>
    
    {/* Bottom Box (Saved by default) */}
    <Animated.View style={[
      styles.bottomBox,
      { backgroundColor: activeView === 'friends' ? '#AE8F72' : '#C8A688' }
    ]}
    entering={FadeInDown.duration(500).delay(450)}
    //exiting={FadeOutDown.duration(50)}
    >
      {Platform.OS === 'ios' ? (
        <Animated.View style={[bottomBoxAnimatedStyle, { flex: 1, borderRadius: 41 }]}>
          <BottomBoxContent 
            activeView={activeView}
            handleBottomBoxPressIn={handleBottomBoxPressIn}
            handleBottomBoxPressOut={handleBottomBoxPressOut}
            renderSavedItem={renderSavedItem}
            renderFriendItem={renderFriendItem}
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
            renderSavedItem={renderSavedItem}
            renderFriendItem={renderFriendItem}
            savedItems={savedItems}
            friendItems={friendItems}
            handleNavigate={handleNavigate}
          />
        </View>
      )}
    </Animated.View>
  </>
  );
};

// Extracted component for bottom box content to reduce render complexity
const BottomBoxContent = ({
  activeView,
  handleBottomBoxPressIn,
  handleBottomBoxPressOut,
  renderSavedItem,
  renderFriendItem,
  savedItems,
  friendItems,
  handleNavigate
}: BottomBoxContentProps) => {
  return (
  <Pressable 
    style={styles.bottomBoxContent} 
    onPressIn={handleBottomBoxPressIn}
    onPressOut={handleBottomBoxPressOut}
  >
    {activeView === 'friends' ? (
      <FlatList<FavoriteItem>
        data={savedItems.slice(0, 2)}
        renderItem={renderSavedItem}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.previewListContent}
        scrollEnabled={false}
        removeClippedSubviews={Platform.OS === 'android'} // Android optimization
        maxToRenderPerBatch={2} // Keep it small
      />
    ) : (
      <FlatList<FriendItem>
        data={friendItems.slice(0, 2)}
        renderItem={renderFriendItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.previewListContent}
        scrollEnabled={false}
        removeClippedSubviews={Platform.OS === 'android'} // Android optimization
        maxToRenderPerBatch={2} // Keep it small
      />
    )}
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
  renderSearchUser,
  onSendFriendRequest,
  onRemoveFriend,
  pendingRemoval,
  showConfirmDialog,
  setShowConfirmDialog,
  setPendingRemoval,
  removeFriend
}: SearchContentProps) => {
  
  return (
  <>
    {/* Search Input */}
    <Animated.View style={styles.searchContainer} entering={FadeInDown.duration(500)} exiting={FadeOutDown.duration(50)}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
    </Animated.View>

    {/* Search Results */}
    <Animated.View style={styles.searchResultsBox} entering={FadeInDown.duration(50).delay(100)} exiting={FadeOutDown.duration(50)}>
      <View style={{ flex: 1 }}>
        {searchQuery.length === 0 ? (
          <Text style={styles.noResultsText}>Начните искать</Text>
        ) : searchQuery.length < 2 ? (
          <Text style={styles.noResultsText}>Введите минимум 2 символа для поиска</Text>
        ) : filteredFriends.length === 0 ? (
          <Text style={styles.noResultsText}>Пользователи не найдены</Text>
        ) : (
          <FlatList<any>
            style={styles.flatList}
            data={filteredFriends}
            renderItem={renderSearchUser}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={5}
          />
        )}
      </View>
    </Animated.View>
    
    {/* Shrunken Top Box */}
    <Animated.View style={[
      styles.topBox,
      styles.searchModeTopBox,
      { backgroundColor: '#C8A688' }
    ]} entering={FadeInDown.duration(500).delay(50)} exiting={FadeOutDown.duration(50)}>
      <View style={styles.titleRow}>
        <Text style={styles.boxTitle}>
          ДРУЗЬЯ
        </Text>
        <Pressable onPress={toggleSearch} style={styles.plusIconContainer}>
          <PlusSvg width={24} height={24} fill="#FFF" />
        </Pressable>
      </View>
    </Animated.View>
  </>
)};

// Define interface for Friend Profile View props
interface FriendProfileViewProps {
  friend: FriendItem;
  onBack: () => void;
  recommendedItems: RecommendedItem[];
  renderRecommendedItem: ListRenderItem<RecommendedItem>;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

// Friend Profile View Component
const FriendProfileView = React.memo(({ 
  friend, 
  onBack, 
  recommendedItems, 
  renderRecommendedItem,
  onRegenerate,
  isRegenerating
}: FriendProfileViewProps) => {
  // Track whether recommendations have been regenerated for animation purposes
  const [isNewRecommendation, setIsNewRecommendation] = useState(false);
  
  // Store the recommendedItems in a ref to avoid unnecessary effect triggers
  const prevItemsRef = useRef<RecommendedItem[]>([]);
  
  // State for friend's public profile
  const [friendProfile, setFriendProfile] = useState<api.PublicUserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // Animated values for button spinning effect
  const [isSpinning, setIsSpinning] = useState(false);
  const borderSpinValue = useRef(new RNAnimated.Value(0)).current;
  const buttonScaleValue = useRef(new RNAnimated.Value(1)).current;
  
  // Map 0-1 animation value to a full 720 degree rotation (two spins)
  const borderSpin = borderSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg']
  });
  
  // Load friend's public profile when component mounts
  useEffect(() => {
    const loadFriendProfile = async () => {
      try {
        setIsLoadingProfile(true);
        setProfileError(null);
        
        const profile = await api.getUserPublicProfile(friend.id);
        setFriendProfile(profile);
        console.log('Loaded friend profile:', profile);
      } catch (error) {
        console.error('Error loading friend profile:', error);
        setProfileError('Не удалось загрузить профиль пользователя');
      } finally {
        setIsLoadingProfile(false);
      }
    };
    
    if (friend.id) {
      loadFriendProfile();
    }
  }, [friend.id]);
  
  // Handle regenerate button press with spinning border animation
  const handleRegeneratePress = () => {
    if (isSpinning || isRegenerating) return; // Prevent multiple presses during animation
    
    // Start spinning and regeneration process immediately
    setIsSpinning(true);
    
    // Start regeneration process immediately rather than waiting for animation to complete
    onRegenerate();
    
    // Reset spin value to 0
    borderSpinValue.setValue(0);
    
    // Create scale down/up sequence with spinning border
    RNAnimated.sequence([
      // Scale down button slightly
      RNAnimated.timing(buttonScaleValue, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
        easing: RNEasing.out(RNEasing.cubic),
      }),
      // Spin border with acceleration and deceleration
      RNAnimated.timing(borderSpinValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: RNEasing.inOut(RNEasing.cubic), // Accelerate and decelerate smoothly
      }),
      // Scale back up
      RNAnimated.timing(buttonScaleValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: RNEasing.out(RNEasing.cubic),
      })
    ]).start(() => {
      // Animation completed - just clear spinning flag
      // but don't trigger onRegenerate again as we've already called it
      setIsSpinning(false);
    });
  };
  
  // Reset the new recommendation flag when items change
  useEffect(() => {
    // Only trigger the animation when items actually change (not on initial render)
    const itemsChanged = prevItemsRef.current.length > 0 && 
      JSON.stringify(prevItemsRef.current) !== JSON.stringify(recommendedItems);
    
    if (recommendedItems.length > 0 && itemsChanged) {
      setIsNewRecommendation(true);
      
      // Reset the flag after animation duration
      const timer = setTimeout(() => {
        setIsNewRecommendation(false);
      }, 1500);
      
      // Update the ref
      prevItemsRef.current = [...recommendedItems];
      
      return () => clearTimeout(timer);
    } else if (recommendedItems.length > 0) {
      // Initial store
      prevItemsRef.current = [...recommendedItems];
    }
  }, [recommendedItems]);
  
  // Create a memoized render function to avoid unnecessary re-renders
  const renderItem = React.useCallback(({ item, index, separators }: ListRenderItemInfo<RecommendedItem>) => {
    return renderRecommendedItem({ item, index, separators });
  }, [renderRecommendedItem, isNewRecommendation]); // Only re-create when these dependencies change
  
  return (
    <Animated.View style={styles.profileContainer} entering={FadeInDown.duration(500)} exiting={FadeOutDown.duration(50)}>
      {/* Header with back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
      >
        <BackIcon width={33} height={33} />
      </TouchableOpacity>

      {/* Profile info */}
      <View style={styles.profileInfo}>
        <View style={styles.profileImageContainer}>
          <Image source={require('./assets/Vision.png')} style={styles.profileImage} />
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.regenerateButtonWrapper}>
        {/* Container for the button - this stays still */}
        <View style={styles.regenerateButtonContainer}>
          {/* Spinning border gradient */}
          <RNAnimated.View
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              borderRadius: 30,
              transform: [{ rotate: borderSpin }],
            }}
          >
            <LinearGradient
              colors={['#FC8CAF', '#9EA7FF', '#A3FFD0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.regenerateButtonBorder}
            />
          </RNAnimated.View>
          
          {/* Button itself - scales but doesn't spin */}
          <RNAnimated.View
            style={{
              width: '100%',
              height: '100%',
              padding: 3, // Match border thickness
              transform: [{ scale: buttonScaleValue }],
            }}
          >
            <TouchableOpacity
              onPress={handleRegeneratePress}
              disabled={isSpinning || isRegenerating}
              style={styles.pressableContainer}
            >
              <LinearGradient
                colors={['#E222F0', '#4747E4', '#E66D7B']}
                locations={[0.15, 0.56, 1]}
                start={{ x: 0.48, y: 1 }}
                end={{ x: 0.52, y: 0 }}
                style={styles.regenerateButtonGradient}
              >
                <Text style={styles.regenerateButtonText}>
                  {isRegenerating || isSpinning ? 'ЗАГРУЗКА...' : 'Сделать AI подборку'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </RNAnimated.View>
        </View>
      </Animated.View>

      <Animated.View style={styles.roundedBox} entering={FadeInDown.duration(500).delay(100)} exiting={FadeOutDown.duration(50)}>
        <LinearGradient
          colors={["rgba(205, 166, 122, 0.5)", "transparent"]}
          start={{ x: 0.1, y: 1 }}
          end={{ x: 0.9, y: 0.3 }}
          locations={[0.2, 1]}
          style={styles.gradientBackground}
        />
        {/* Recommendations section */}
        <Animated.View style={styles.recommendationsContainer} entering={FadeInDown.duration(500).delay(150)}>
          
          {isRegenerating ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Подбираем новые рекомендации...</Text>
            </View>
          ) : (
            <FlatList<RecommendedItem>
              style={styles.recommendationsList}
              data={recommendedItems}
              renderItem={renderItem}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
              removeClippedSubviews={Platform.OS === 'android'}
              initialNumToRender={4}
              maxToRenderPerBatch={4}
              windowSize={5}
            />
          )}
        </Animated.View> 
        <Animated.View 
            style={styles.textContainer}
          >
            <Text style={styles.text}>
              {isLoadingProfile ? 'Загрузка...' : profileError ? friend.username : friendProfile?.username || friend.username}
            </Text>
          </Animated.View>
      </Animated.View>
    </Animated.View>
  );
});

// Friend Request Item Component
interface FriendRequestItemProps {
  request: FriendRequestItem;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const FriendRequestItemComponent: React.FC<FriendRequestItemProps> = ({ request, onAccept, onReject }) => {
  return (
    <View style={styles.requestItemWrapper}>
      <Animated.View entering={FadeInDown.duration(300)}>
        <View style={styles.requestItemContainer}>
          <View style={styles.requestImageContainer}>
            <Image source={require('./assets/Vision.png')} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>@{request.username}</Text>
            </View>
          </View>
          <View style={styles.requestButtonsContainer}>
            <TouchableOpacity 
              style={[styles.requestButton, styles.acceptButton]}
              onPress={() => onAccept(request.requestId)}
            >
              <Text style={styles.requestButtonText}>Принять</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.requestButton, styles.rejectButton]}
              onPress={() => onReject(request.requestId)}
            >
              <Text style={styles.requestButtonText}>Отклонить</Text>
            </TouchableOpacity>
          </View>
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
    height: (width*0.88-45)/2,
    width: '100%', // Calculate width for two columns with spacing
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    backgroundColor: '#EDE7E2',
    borderRadius: 30,
    position: 'relative', // For absolute positioned elements
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    flexDirection: 'row',
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
    position: 'relative', // For absolute positioned elements
    flexDirection: 'row',
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  userImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  itemImageContainer: {
    overflow: 'hidden',
    aspectRatio: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    padding: 5,
    height: '100%',
    width: '100%'
  },
  imageContainer: {
    overflow: 'hidden',
    aspectRatio: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    width: width * 0.2,
    height: width * 0.2,
    //backgroundColor: '#EDE7E2',
  },
  itemImage: {
    width: '73%',
    height: '73%',
    resizeMode: 'contain',
  },
  userImage: {
    resizeMode: 'contain',
    height: '100%',
    width:'100%',
    borderRadius: width * 0.2,
  },
  userInfo: {
    alignItems: 'center',
    padding: 6,
    position: 'absolute',
    bottom: 10
  },
  itemInfo: {
    alignItems: 'center',
    padding: 6,
  },
  itemName: {
    fontFamily: 'IgraSans',
    fontSize: 13,
    color: '#4A3120',
    textAlign: 'center',
    bottom: -5,
  },
  priceContainer: {
    position: 'absolute',
    right: -25,
    top: (width*0.88-45)/4,
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
    width: '88%',
    left: '6%',
    height: height*0.1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    backgroundColor: '#F2ECE7',
    borderRadius: 41,
    zIndex: 10,
    //position: 'absolute',
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
    paddingVertical: Platform.OS === 'ios' ? 35 : 27, // Smaller on Android
    marginRight: -1,
  },
  cancelButtonText: {
    fontFamily: 'Igra Sans',
    fontSize: 18,
    color: '#4A3120',
  },
  searchResultsBox: {
    position: 'absolute',
    left: '6%',
    top: Platform.OS === 'ios' ? height * 0.145 : height * 0.166,
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
    width: (width * 0.88 - 40) / 2,
    //marginBottom: 15,
  },
  searchItemWrapper: {
    width: '47%',
    //marginBottom: 17,
  },
  usernameContainer: {
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
  usernameText: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#4A3120',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? height * 0.02 : height * 0.04,
    right: 10,
    padding: 10,
    backgroundColor: '#C8A688',
    borderRadius: 41,
  },
  toggleButtonText: {
    fontFamily: 'Igra Sans',
    fontSize: 18,
    color: '#FFF',
  },
  // Friend Profile styles
  profileContainer: {
    width: '88%',
    height: '92%',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 0,
    left: 10,
    zIndex: 10,
    width: 33,
    height: 33,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 25,
  },
  profileImageContainer: {
    width: width*0.3,
    height: width*0.3,
    borderRadius: width*0.1,
    overflow: 'hidden',
    backgroundColor: '#EDE7E2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  profileImage: {
    width: '75%',
    height: '75%',
    resizeMode: 'contain',
    borderRadius: width*0.1125,
  },
  roundedBox: {
    width: '100%',
    height: width*1.06,
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
  recommendationsContainer: {
    backgroundColor: '#F2ECE7',
    borderRadius: 41,
    width: width * 0.88,
    height: width * 0.88,
    top: -3,
    left: -3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  recommendationsList: {
    flex: 1,
    borderRadius: 41,
    padding: 15,
    //paddingTop: 17.5,
  },
  regenerateButtonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 20,
  },
  regenerateButtonContainer: {
    width: 280, // Fixed width to ensure consistent size
    height: 65, // Fixed height for the button
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 8,
      }
    }),
    position: 'relative',
  },
  regenerateButtonBorder: {
    flex: 1,
    borderRadius: 30,
    zIndex: 5,
  },
  pressableContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    overflow: 'hidden',
  },
  regenerateButtonGradient: {
    flex: 1,
    borderRadius: 27, // Slightly smaller to create border effect
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    overflow: 'hidden',
  },
  regenerateButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 15,
    color: 'white',
  },
  regenerateButtonDisabled: {
    backgroundColor: '#8F7A66',
    opacity: 0.8,
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    marginBottom: 18,
    marginLeft: 15,
  },
  text: {
    fontFamily: 'IgraSans',
    fontSize: 38,
    color: '#fff',
  },
  requestItemWrapper: {
    width: '100%',
    padding: 10,
  },
  requestItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 10,
  },
  requestButtonsContainer: {
    flexDirection: 'row',
  },
  requestButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#C8A688',
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: '#A8E6BB',
  },
  rejectButton: {
    backgroundColor: '#E9A5AA'
  },
  requestButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 15,
    color: 'white',
  },
  confirmationContainer: {
    height: '88%',
    width: '88%',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#E9A5AA',
    borderRadius: 30,
  },
  confirmationText: {
    fontFamily: 'IgraSans',
    fontSize: 15,
    color: '#4A3120',
    lineHeight: 20,
    opacity: 0.8,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  confirmButton: {
    padding: 10,
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#C8A688',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  confirmYesButton: {
    backgroundColor: '#E78791', // Red for remove 
  },
  confirmNoButton: {
    backgroundColor: '#B0B0B0',
  },
  confirmButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 15,
    color: '#4A3120',
    opacity: 0.8,
  },
  removeFriendButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 2.5,
    backgroundColor: 'rgba(230, 109, 123, 0.54)',
    borderRadius: 20,
  },
  removeFriendButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 15,
    color: 'white',
  },
  sectionTitle: {
    fontFamily: 'IgraSans',
    fontSize: 24,
    color: '#4A3120',
    marginBottom: 10,
  },
  miniRequestButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniRequestButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: '#C8A688',
    marginHorizontal: 5,
  },
  miniAcceptButton: {
    backgroundColor: '#A3FFD0',
  },
  miniRejectButton: {
    backgroundColor: '#FC8CAF',
  },
  miniRequestButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 15,
    color: 'white',
  },
  pendingRequestBadge: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: '#C8A688',
    marginLeft: 10,
  },
  pendingRequestText: {
    fontFamily: 'IgraSans',
    fontSize: 15,
    color: 'white',
  },
  addFriendButton: {
    padding: 5,
    borderRadius: 20,
    //marginLeft: 10,
  },
  addFriendButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 15,
    color: 'white',
  },
  cancelRequestButton: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 3,
    width: width * 0.15,
    height: width * 0.15,
  },
  cancelRequestText: {
    color: '#4A3120', 
    fontFamily: 'IgraSans', 
    fontSize: 10,
    textAlign: 'center'
  },
  stackedButtonsContainer: {
    position: 'relative',
    marginLeft: 5,
    flexDirection: 'column',
    gap: 10,
    //right: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackedButton: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  stackedButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 18,
    color: 'white',
  },
  confirmationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  buttonContainerStyle: {
    width: width * 0.15,
    height: width * 0.15,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Add above Favorites component
interface FriendListItemProps {
  item: FriendItem;
  onAddFriend?: () => void;
  onCancelRequest?: () => void;
  onAcceptRequest?: () => void;
  onRejectRequest?: () => void;
  onRemoveFriend?: () => void;
  onPress?: () => void;
  styles: any;
  width: number;
}

const FriendListItem = memo(({ item, onAddFriend, onCancelRequest, onAcceptRequest, onRejectRequest, onRemoveFriend, onPress, styles, width }: FriendListItemProps) => {
  console.log('FriendListItem rendering with item:', item);
  
  return (
    <View style={styles.itemWrapper}>
      <View style={styles.itemContainer}>
        <Pressable 
          style={styles.userImageContainer}
          onPress={onPress}
        >
          <View style={styles.imageContainer}>
            <Image source={require('./assets/Vision.png')} style={styles.userImage} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.itemName} numberOfLines={1}>@{item.username}</Text>
          </View>
        </Pressable>
        <UserActionButton
          status={item.status}
          onAddFriend={onAddFriend}
          onCancelRequest={onCancelRequest}
          onAcceptRequest={onAcceptRequest}
          onRejectRequest={onRejectRequest}
          onRemoveFriend={onRemoveFriend}
          styles={styles}
          width={width}
        />
      </View>
    </View>
  );
});

// Now update renderFriendItem and renderSearchUser to use FriendListItem

export default Favorites;