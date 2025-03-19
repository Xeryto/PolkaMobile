import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  Pressable,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// Define a simpler navigation type that our custom navigation can satisfy
interface SimpleNavigation {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  setParams?: (params: any) => void;
}

interface SearchProps {
  navigation: SimpleNavigation;
}

interface SearchItem {
  id: number;
  name: string;
  price: string;
  image: any;
}

interface FilterOptions {
  category: string[];
  brand: string[];
  style: string[];
}

interface SelectedFilters {
  category: string;
  brand: string;
  style: string;
}

// Simulated API to fetch more search results
const fetchMoreSearchResults = (query: string = '', filters: SelectedFilters = {
  category: 'Категория',
  brand: 'Бренд',
  style: 'Стиль'
}, count: number = 2): Promise<SearchItem[]> => {
  // In a real app, this would be an API call with the search query and filters
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Generate unique IDs for new search results items
      const timestamp = new Date().getTime();
      const newResults: SearchItem[] = [];
      
      for (let i = 0; i < count; i++) {
        // Create unique ID based on timestamp and index
        const uniqueId = parseInt(`${timestamp}${i}`.slice(-9));
        newResults.push({
          id: uniqueId,
          name: `SEARCH RESULT ${uniqueId % 1000}${query ? ` - ${query}` : ''}`,
          price: `${(Math.random() * 50000).toFixed(0)} р`,
          image: i % 2 === 0 ? 
            require('./assets/Vision.png') : 
            require('./assets/Vision2.png')
        });
      }
      
      console.log('Search API - Fetched new results:', newResults);
      resolve(newResults);
    }, 500); // 500ms delay to simulate network
  });
};

// Persistent storage for search results that survives component unmounts
const persistentSearchStorage: {
  results: SearchItem[];
  initialized: boolean;
} = {
  results: [],
  initialized: false
};

const Search = ({ navigation }: SearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<keyof FilterOptions | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    category: 'Категория',
    brand: 'Бренд',
    style: 'Стиль'
  });
  
  // Initialize searchResults with persistent storage or default items
  const [searchResults, setSearchResults] = useState<SearchItem[]>(() => {
    // If we already have results in our persistent storage, use those
    if (persistentSearchStorage.initialized) {
      console.log('Search - Using persistent results:', persistentSearchStorage.results);
      return persistentSearchStorage.results;
    }
    
    // Otherwise initialize with default items
    const defaultResults = [
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
        name: 'THIRD ITEM', 
        price: '22 000 р', 
        image: require('./assets/Vision.png') 
      },
      { 
        id: 4, 
        name: 'FOURTH ITEM', 
        price: '18 000 р', 
        image: require('./assets/Vision2.png') 
      },
    ];
    
    // Save to persistent storage
    persistentSearchStorage.results = defaultResults;
    persistentSearchStorage.initialized = true;
    console.log('Search - Initialized persistent results storage');
    
    return defaultResults;
  });

  const filterOptions: FilterOptions = {
    category: ['Dresses', 'Tops', 'Pants', 'Accessories'],
    brand: ['Brand A', 'Brand B', 'Brand C', 'Brand D'],
    style: ['Casual', 'Formal', 'Sport', 'Evening']
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleSearchFocus = () => {
    setIsSearchActive(true);
  };

  const handleFilterPress = (filterType: keyof FilterOptions) => {
    setActiveFilter(activeFilter === filterType ? null : filterType);
  };

  const handleOptionSelect = (filterType: keyof FilterOptions, option: string) => {
    const defaultValues = {
      category: 'Категория',
      brand: 'Бренд',
      style: 'Стиль'
    };
    
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === option ? defaultValues[filterType] : option
    }));
    setActiveFilter(null);
  };

  const isFilterSelected = (filterType: keyof SelectedFilters): boolean => {
    const defaultValues = {
      category: 'Категория',
      brand: 'Бренд',
      style: 'Стиль'
    };
    return selectedFilters[filterType] !== defaultValues[filterType];
  };

  // Handle item selection and removal
  const handleItemPress = (item: SearchItem, index: number) => {
    // Remove the selected item from the array
    setSearchResults(prevResults => {
      const newResults = [...prevResults];
      // Remove the selected item
      newResults.splice(index, 1);
      
      // Update persistent storage
      persistentSearchStorage.results = newResults;
      console.log('Search - Item removed, remaining results:', newResults.length);
      
      return newResults;
    });
    
    // If we're running low on search results (less than 3), fetch more
    if (searchResults.length < 4) {
      console.log('Search - Low on results, fetching more from API');
      // Fetch exactly 2 new items at a time
      fetchMoreSearchResults(searchQuery, selectedFilters, 2).then(newResults => {
        setSearchResults(prevResults => {
          const updatedResults = [...prevResults, ...newResults];
          // Update persistent storage
          persistentSearchStorage.results = updatedResults;
          console.log('Search - Added new results, total count:', updatedResults.length);
          return updatedResults;
        });
      });
    }
    
    // Create params to pass the selected item to MainPage
    const params = { 
      addCardItem: {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image
      }
    };
    
    console.log('Search - Navigating to Home with item:', params);
    
    // Navigate to Home screen with the selected item as a parameter
    navigation.navigate('Home', params);
  };

  // Update the filter function to check both name and query
  const filteredResults = searchQuery.length > 0
    ? searchResults.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchResults;

  // Update persistent storage whenever searchResults change
  useEffect(() => {
    persistentSearchStorage.results = searchResults;
    console.log('Search - Updated persistent storage with results:', searchResults);
  }, [searchResults]);

  // Fetch new results when search query or filters change
  useEffect(() => {
    // Only fetch if the search is active (user has clicked in the search field)
    if (isSearchActive) {
      // Add a small delay to avoid fetching on every keystroke
      const timer = setTimeout(() => {
        console.log('Search - Query or filters changed, fetching new results');
        fetchMoreSearchResults(searchQuery, selectedFilters, 4).then(newResults => {
          setSearchResults(prevResults => {
            // If search query changed, replace all results
            // If just filters changed, append to existing results
            const wasQueryChange = searchQuery.length > 0;
            const updatedResults = wasQueryChange ? newResults : [...prevResults, ...newResults];
            
            // Update persistent storage
            persistentSearchStorage.results = updatedResults;
            console.log('Search - Added new filtered results, total count:', updatedResults.length);
            return updatedResults;
          });
        });
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery, selectedFilters.category, selectedFilters.brand, selectedFilters.style, isSearchActive]);

  const renderItem = ({ item, index }: { item: SearchItem, index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(400).delay(100 + index * 50)}
      style={styles.searchItem}
    >
      <Pressable 
        style={styles.imageContainer}
        onPress={() => handleItemPress(item, index)}
      >
        <Image source={item.image} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.itemPrice}>{item.price}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeInDown.duration(400).delay(200)}
        style={[
          styles.searchContainer,
          !isSearchActive && styles.searchContainerInitial
        ]}
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск"
          placeholderTextColor="rgba(0,0,0,0.6)"
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={handleSearchFocus}
        />
      </Animated.View>
      {isSearchActive && (
        <Animated.View 
          entering={FadeInDown.duration(400).delay(250)}
          style={styles.filtersContainer}
        >
          {/* Main Filter Buttons */}
          <View style={styles.filterButtons}>
            {Object.keys(filterOptions).map((filterType) => (
              <Pressable
                key={filterType}
                style={[
                  styles.filterButton,
                  isFilterSelected(filterType as keyof SelectedFilters) && styles.filterButtonActive
                ]}
                onPress={() => handleFilterPress(filterType as keyof FilterOptions)}
              >
                <Text style={[
                  styles.filterButtonText,
                  isFilterSelected(filterType as keyof SelectedFilters) && styles.filterButtonTextActive
                ]}>
                  {selectedFilters[filterType as keyof SelectedFilters]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Options Dropdown */}
          {activeFilter && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={styles.optionsContainer}
            >
              {filterOptions[activeFilter as keyof FilterOptions].map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.optionButton,
                    selectedFilters[activeFilter as keyof SelectedFilters] === option && styles.optionButtonActive
                  ]}
                  onPress={() => handleOptionSelect(activeFilter as keyof FilterOptions, option)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    selectedFilters[activeFilter as keyof SelectedFilters] === option && styles.optionButtonTextActive
                  ]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </Animated.View>
          )}
        </Animated.View>
      )}
      <Animated.View 
        entering={FadeIn.duration(500).delay(300)}
        style={[
          styles.roundedBox,
          !isSearchActive && styles.roundedBoxInitial
        ]}
      >
        <Animated.View 
          entering={FadeInDown.duration(400).delay(300)}
          style={{flex: 1}}
        >
          {filteredResults.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No results found</Text>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <FlatList
              style={[
                styles.resultsContainer,
                !isSearchActive && styles.resultsContainerInitial
              ]}
              data={filteredResults}
              renderItem={renderItem}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
            />
          )}
        </Animated.View>
        {!isSearchActive && (
          <Animated.Text 
            entering={FadeIn.duration(500)}
            style={styles.popularItemsText}
          >
            ПОПУЛЯРНОЕ
          </Animated.Text>
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
  roundedBox: {
    width: '88%',
    height: '75%',
    borderRadius: 41,
    backgroundColor: '#F2ECE7',
    position: 'relative',
    //padding: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  searchContainer: {
    width: '88%',
    marginBottom: '3.6%',
    height: '12%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    backgroundColor: '#F2ECE7',
    borderRadius: 41,
  },
  searchInput: {
    padding: 15,
    fontSize: 30,
    fontFamily: 'Igra Sans',
    width: '100%',
    height: '100%'
  },
  filtersContainer: {
    marginBottom: '5%',
    width: '88%',
    zIndex: 998,
    height: '5%',
    borderRadius: 41,
    backgroundColor: '#F2ECE7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    //padding: 4,
    height: '100%',
    //marginHorizontal: -4
  },
  filterButton: {
    flex: 1,
    //paddingVertical: 4,
    //paddingHorizontal: 8,
    borderRadius: 41,
    //marginHorizontal: 4,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#CDA67A',
  },
  filterButtonText: {
    fontFamily: 'Igra Sans',
    fontSize: 14,
    color: '#4A3120',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  optionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F2ECE7',
    borderRadius: 17,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 24,
    zIndex: 999,
    //...(Platform.OS === 'android' ? { elevation: 24 } : {}),
  },
  optionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginVertical: 1,
  },
  optionButtonActive: {
    backgroundColor: '#CDA67A',
  },
  optionButtonText: {
    fontFamily: 'Igra Sans',
    fontSize: 14,
    color: '#000',
  },
  optionButtonTextActive: {
    color: 'white',
  },
  resultsContainer: {
    flex: 1,
    padding: 11,
    borderRadius: 41,
  },
  resultsContainerInitial: {
    borderTopLeftRadius: 41,
    borderTopRightRadius: 41,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  searchItem: {
    width: '47%',
    marginBottom: 17,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    backgroundColor: '#EDE7E2',
    borderRadius: 30,
  },
  imageContainer: {
    overflow: 'hidden',
    aspectRatio: 1,
    position: 'relative',
    //padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: '73%',
    height: '73%',
    resizeMode: 'contain',
  },
  itemInfo: {
    // position: 'absolute',
    bottom: -5,
    // left: 10,
    // right: 10,
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
    //backgroundColor: 'rgba(242, 236, 231, 0.8)',
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
  noResultsText: {
    fontFamily: 'REM',
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: 'REM',
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: 10,
  },
  searchContainerInitial: {
    marginBottom: '5%',
  },
  roundedBoxInitial: {
    height: '82%',
  },
  popularItemsText: {
    fontFamily: 'Igra Sans',
    fontSize: 38,
    color: '#73706D',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
});

export default Search; 