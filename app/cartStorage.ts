import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing cart data
const CART_ITEMS_KEY = '@PolkaMobile:cartItems';

// Define cart item type
export interface CartItem {
  id: number;
  name: string;
  price: string;
  image: any;
  size: string;
  quantity: number;
  isLiked?: boolean;
  cartItemId?: string; // Add unique identifier for each cart item
}

// Initialize the cart from storage
export const initializeCart = async (): Promise<CartItem[]> => {
  try {
    const storedCartItems = await AsyncStorage.getItem(CART_ITEMS_KEY);
    if (storedCartItems) {
      // Parse the stored items, making sure to handle image references correctly
      const parsedItems: CartItem[] = JSON.parse(storedCartItems);
      
      // Ensure all items have a cartItemId
      parsedItems.forEach(item => {
        if (!item.cartItemId) {
          item.cartItemId = `${item.id}-${item.size}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        }
      });
      
      console.log('cartStorage - Initialized cart from storage with items:', parsedItems.length);
      return parsedItems;
    }
    return [];
  } catch (error) {
    console.error('Error initializing cart from storage:', error);
    return [];
  }
};

// Save cart items to persistent storage
export const saveCartItems = async (items: CartItem[]): Promise<void> => {
  try {
    // We need to store the cart items without the actual image objects
    // because they can't be serialized - we'll store references that we can resolve later
    
    await AsyncStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
    console.log('cartStorage - Saved cart items to storage, count:', items.length);
  } catch (error) {
    console.error('Error saving cart items to storage:', error);
  }
};

// Clear cart data (used during logout)
export const clearCart = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CART_ITEMS_KEY);
    console.log('cartStorage - Cart data cleared from storage');
  } catch (error) {
    console.error('Error clearing cart data:', error);
  }
};

// Create a cart storage interface compatible with the global cartStorage
export const createCartStorage = (initialItems: CartItem[] = []): CartStorage => {
  return {
    items: [...initialItems],
    
    // Add item to cart (always add as a new item)
    addItem(item: CartItem) {
      // Generate a unique ID for the cart item
      const cartItem = {
        ...item,
        cartItemId: `${item.id}-${item.size}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      // Always add as a new item
      this.items.push(cartItem);
      console.log('Cart - Added new item to cart:', cartItem);
      
      // Save to persistent storage whenever the cart changes
      saveCartItems(this.items);
    },
    
    // Remove specific item from cart by cartItemId
    removeItem(cartItemId: string) {
      this.items = this.items.filter(item => item.cartItemId !== cartItemId);
      console.log('Cart - Removed item with cartItemId:', cartItemId);
      
      // Save to persistent storage whenever the cart changes
      saveCartItems(this.items);
    },
    
    // Update quantity of an item
    updateQuantity(cartItemId: string, change: number) {
      const itemIndex = this.items.findIndex(item => item.cartItemId === cartItemId);
      if (itemIndex >= 0) {
        this.items[itemIndex].quantity = Math.max(1, this.items[itemIndex].quantity + change);
        console.log('Cart - Updated quantity for item:', this.items[itemIndex]);
        
        // Save to persistent storage whenever the cart changes
        saveCartItems(this.items);
      }
    },
    
    // Get all items in cart
    getItems() {
      return this.items;
    }
  };
};

// CartStorage interface definition
export interface CartStorage {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, change: number) => void;
  getItems: () => CartItem[];
} 