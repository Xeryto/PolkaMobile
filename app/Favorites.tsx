import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// Define a simpler navigation type that our custom navigation can satisfy
interface SimpleNavigation {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface FavoritesProps {
  navigation: SimpleNavigation;
}

interface FavoriteItem {
  id: number;
  name: string;
  price: string;
  image: any;
  dateAdded: string;
}

const Favorites = ({ navigation }: FavoritesProps) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([
    { 
      id: 1, 
      name: 'NAME', 
      price: '25 000 р', 
      image: require('./assets/Vision.png'),
      dateAdded: '12 May 2023'
    },
    { 
      id: 2, 
      name: 'ANOTHER NAME', 
      price: '30 000 р', 
      image: require('./assets/Vision2.png'),
      dateAdded: '15 June 2023'
    },
  ]);

  const removeFromFavorites = (id: number) => {
    setFavorites(prevFavorites => prevFavorites.filter(item => item.id !== id));
  };

  const renderFavoriteItem = ({ item, index }: { item: FavoriteItem, index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(200 + index * 100)}
      style={styles.favoriteItem}
    >
      <Image source={item.image} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price}</Text>
        <Text style={styles.itemDate}>Added: {item.dateAdded}</Text>
      </View>
      <View style={styles.buttonsContainer}>
        <Pressable 
          style={styles.viewButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </Pressable>
        <Pressable 
          style={styles.removeButton}
          onPress={() => removeFromFavorites(item.id)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </Pressable>
      </View>
    </Animated.View>
  );

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
        
        <Text style={styles.title}>Favorites</Text>
        
        {favorites.length === 0 ? (
          <Animated.View 
            entering={FadeInDown.duration(500).delay(300)}
            style={styles.emptyContainer}
          >
            <Text style={styles.emptyText}>You haven't saved any favorites yet</Text>
            <Pressable 
              style={styles.shopButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.shopButtonText}>Browse Products</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderFavoriteItem}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
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
  listContent: {
    paddingBottom: 20,
  },
  favoriteItem: {
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
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
    resizeMode: 'contain',
  },
  itemDetails: {
    marginBottom: 15,
  },
  itemName: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    marginBottom: 5,
    textAlign: 'center',
  },
  itemPrice: {
    fontFamily: 'REM',
    fontSize: 18,
    color: '#6A462F',
    marginBottom: 5,
    textAlign: 'center',
  },
  itemDate: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  viewButton: {
    backgroundColor: '#CDA67A',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  viewButtonText: {
    color: 'white',
    fontFamily: 'IgraSans',
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FF6B6B',
    fontFamily: 'IgraSans',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'REM',
    fontSize: 18,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
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
});

export default Favorites; 