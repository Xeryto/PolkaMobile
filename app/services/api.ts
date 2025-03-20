import AsyncStorage from '@react-native-async-storage/async-storage';

// API configuration
const API_URL = 'https://api.polkamobile.com'; // Replace with your actual API URL
const SESSION_TOKEN_KEY = '@PolkaMobile:sessionToken';
const SESSION_EXPIRY_KEY = '@PolkaMobile:sessionExpiry';
const USER_PROFILE_KEY = '@PolkaMobile:userProfile'; // Added to persist user data between sessions

// User profile interfaces
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isProfileComplete: boolean;
  stylePreference?: 'option1' | 'option2'; // Gender preference
  selectedBrands?: string[];
  favoriteStyles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserProfile;
}

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  requiredScreens: ('confirmation' | 'brands' | 'styles')[];
}

// Product interfaces
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  discount_price: string | null;
  brand: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  styles: string[];
  images: {
    id: number;
    image: string;
    is_primary: boolean;
  }[];
  available_sizes: string[];
  in_stock: boolean;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string;
  description: string;
}

export interface Style {
  id: string;
  name: string;
  description: string;
  image: string;
}

export interface Recommendations {
  based_on_style: Product[];
  based_on_brands: Product[];
  trending_now: Product[];
  new_arrivals: Product[];
}

// Error handling
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Helper to handle API responses
const handleApiResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new ApiError(
      data.message || 'An error occurred',
      response.status
    );
  }
  
  return data;
};

// API request helper with authentication
const apiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
) => {
  // Get session token
  const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    method,
    headers,
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    return await handleApiResponse(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    } else {
      console.error('API request failed:', error);
      throw new ApiError('Network error', 0);
    }
  }
};

// Session management
export const storeSession = async (token: string, expiresAt: string) => {
  try {
    await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);
    await AsyncStorage.setItem(SESSION_EXPIRY_KEY, expiresAt);
  } catch (error) {
    console.error('Error storing session:', error);
    throw error;
  }
};

export const getSession = async (): Promise<{ token: string | null, isValid: boolean }> => {
  try {
    const token = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
    const expiryString = await AsyncStorage.getItem(SESSION_EXPIRY_KEY);
    
    if (!token || !expiryString) {
      return { token: null, isValid: false };
    }
    
    const expiryDate = new Date(expiryString);
    const now = new Date();
    
    return {
      token,
      isValid: expiryDate > now
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return { token: null, isValid: false };
  }
};

export const clearSession = async () => {
  try {
    await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
    await AsyncStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
    throw error;
  }
};

// User profile persistence
export const storeUserProfile = async (profile: UserProfile) => {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error storing user profile:', error);
  }
};

export const retrieveUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const profileJson = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return profileJson ? JSON.parse(profileJson) : null;
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    return null;
  }
};

// Authentication API
export const registerUser = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  return apiRequest('/auth/register', 'POST', {
    username,
    email,
    password
  });
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await apiRequest('/auth/login', 'POST', {
    email,
    password
  });
  
  // Store session information
  await storeSession(response.token, response.expiresAt);
  
  return response;
};

export const logoutUser = async (): Promise<void> => {
  try {
    await apiRequest('/auth/logout', 'POST');
  } finally {
    // Always clear local session data
    await clearSession();
    // Optionally clear the stored profile
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
  }
};

// User profile API
export const getCurrentUser = async (): Promise<UserProfile> => {
  return apiRequest('/user/profile');
};

export const getProfileCompletionStatus = async (): Promise<ProfileCompletionStatus> => {
  return apiRequest('/user/profile/completion-status');
};

export const updateStylePreference = async (
  stylePreference: 'option1' | 'option2'
): Promise<UserProfile> => {
  return apiRequest('/user/preferences/style', 'PUT', {
    stylePreference
  });
};

export const updateSelectedBrands = async (
  selectedBrands: string[]
): Promise<UserProfile> => {
  return apiRequest('/user/preferences/brands', 'PUT', {
    selectedBrands
  });
};

export const updateFavoriteStyles = async (
  favoriteStyles: string[]
): Promise<UserProfile> => {
  return apiRequest('/user/preferences/favorite-styles', 'PUT', {
    favoriteStyles
  });
};

// Product API
export const getProducts = async (params?: Record<string, any>): Promise<{ results: Product[] }> => {
  let query = '';
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });
    query = `?${queryParams.toString()}`;
  }
  
  return apiRequest(`/products${query}`);
};

export const getProductDetails = async (id: number): Promise<Product> => {
  return apiRequest(`/products/${id}`);
};

export const getBrands = async (): Promise<Brand[]> => {
  return apiRequest('/products/brands');
};

export const getStyles = async (): Promise<Style[]> => {
  return apiRequest('/products/styles');
};

// Recommendations API
export const getRecommendations = async (): Promise<Recommendations> => {
  return apiRequest('/recommendations');
};

// Simulated API functions (for development without backend)
let SIMULATED_USER: UserProfile | null = null;

// Simulation data - Brand names
const BRAND_NAMES = [
  'Adidas', 'Nike', 'Puma', 'Reebok', 'New Balance', 
  'Converse', 'Vans', 'Under Armour', 'H&M', 'Zara', 
  'Uniqlo', 'Mango', 'Lacoste', 'Tommy Hilfiger', 'Calvin Klein',
  'Levi\'s', 'The North Face', 'Columbia', 'Gucci', 'Prada'
];

// Simulation data - Popular styles
const POPULAR_STYLES = [
  { id: 'casual', name: 'Повседневный', description: 'Комфортная одежда для ежедневной носки', image: 'https://example.com/casual.jpg' },
  { id: 'formal', name: 'Деловой', description: 'Элегантная одежда для офиса и встреч', image: 'https://example.com/formal.jpg' },
  { id: 'sport', name: 'Спортивный', description: 'Функциональная одежда для активного образа жизни', image: 'https://example.com/sport.jpg' },
  { id: 'romantic', name: 'Романтичный', description: 'Женственные, изящные силуэты', image: 'https://example.com/romantic.jpg' },
  { id: 'streetwear', name: 'Уличный', description: 'Современный городской стиль', image: 'https://example.com/streetwear.jpg' },
  { id: 'vintage', name: 'Винтаж', description: 'Классические силуэты прошлых десятилетий', image: 'https://example.com/vintage.jpg' },
  { id: 'minimalist', name: 'Минимализм', description: 'Простые, лаконичные силуэты и нейтральные цвета', image: 'https://example.com/minimalist.jpg' },
  { id: 'bohemian', name: 'Богемный', description: 'Свободные силуэты и этнические мотивы', image: 'https://example.com/bohemian.jpg' }
];

// Simulation data - Mock products
const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Футболка базовая',
    slug: 'basic-tshirt',
    description: 'Комфортная базовая футболка из 100% хлопка',
    price: '1990.00',
    discount_price: null,
    brand: 'Adidas',
    category: {
      id: 3,
      name: 'Футболки',
      slug: 't-shirts'
    },
    styles: ['casual', 'sport'],
    images: [
      {
        id: 1,
        image: 'https://example.com/products/tshirt1.jpg',
        is_primary: true
      }
    ],
    available_sizes: ['S', 'M', 'L', 'XL'],
    in_stock: true
  },
  {
    id: 2,
    name: 'Джинсы классические',
    slug: 'classic-jeans',
    description: 'Классические джинсы прямого кроя',
    price: '3990.00',
    discount_price: null,
    brand: 'Levi\'s',
    category: {
      id: 4,
      name: 'Джинсы',
      slug: 'jeans'
    },
    styles: ['casual', 'minimalist'],
    images: [
      {
        id: 2,
        image: 'https://example.com/products/jeans1.jpg',
        is_primary: true
      }
    ],
    available_sizes: ['30', '32', '34', '36'],
    in_stock: true
  },
  {
    id: 3,
    name: 'Кроссовки беговые',
    slug: 'running-shoes',
    description: 'Легкие кроссовки для бега и повседневной носки',
    price: '5990.00',
    discount_price: '4990.00',
    brand: 'Nike',
    category: {
      id: 5,
      name: 'Обувь',
      slug: 'footwear'
    },
    styles: ['sport', 'casual'],
    images: [
      {
        id: 3,
        image: 'https://example.com/products/shoes1.jpg',
        is_primary: true
      }
    ],
    available_sizes: ['40', '41', '42', '43', '44'],
    in_stock: true
  }
];

// Helper to simulate API response delay
export const simulateApiResponse = <T>(data: T, delay = 500): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

// Check for existing user profile on app start
export const initSimulatedUser = async () => {
  // Try to load user from storage first
  const storedUser = await retrieveUserProfile();
  if (storedUser) {
    SIMULATED_USER = storedUser;
    console.log('Loaded user profile from storage:', SIMULATED_USER.name);
  }
};

export const simulateRegister = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  // Create a simulated user with incomplete profile
  SIMULATED_USER = {
    id: '1',
    name: username,
    email,
    isProfileComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Store the user profile for persistence between app sessions
  await storeUserProfile(SIMULATED_USER);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days
  
  const response: AuthResponse = {
    token: 'simulated-jwt-token',
    expiresAt: expiresAt.toISOString(),
    user: SIMULATED_USER
  };
  
  // Store session information
  await storeSession(response.token, response.expiresAt);
  
  return simulateApiResponse(response);
};

export const simulateLogin = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  // First check if we have a persisted user
  const storedUser = await retrieveUserProfile();
  
  if (storedUser && storedUser.email === email) {
    // Use the stored user profile
    SIMULATED_USER = storedUser;
    console.log('User found in storage, login successful');
  } else {
    // Create a simulated user if needed (for testing)
    SIMULATED_USER = {
      id: '1',
      name: email.split('@')[0], // Use part of email as name
      email,
      isProfileComplete: false, // Simulate incomplete profile
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store the new user profile
    await storeUserProfile(SIMULATED_USER);
  }
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days
  
  const response: AuthResponse = {
    token: 'simulated-jwt-token',
    expiresAt: expiresAt.toISOString(),
    user: SIMULATED_USER
  };
  
  // Store session information
  await storeSession(response.token, response.expiresAt);
  
  return simulateApiResponse(response);
};

export const simulateLogoutUser = async (): Promise<void> => {
    await clearSession();
      // Optionally clear the stored profile
    await AsyncStorage.removeItem(USER_PROFILE_KEY);
  };

export const simulateGetCurrentUser = async (): Promise<UserProfile> => {
  if (!SIMULATED_USER) {
    // Try to load from storage first
    const storedUser = await retrieveUserProfile();
    
    if (storedUser) {
      SIMULATED_USER = storedUser;
    } else {
      throw new ApiError('Unauthorized', 401);
    }
  }
  
  return simulateApiResponse(SIMULATED_USER);
};

export const simulateGetProfileCompletionStatus = async (): Promise<ProfileCompletionStatus> => {
  if (!SIMULATED_USER) {
    // Try to load from storage first
    const storedUser = await retrieveUserProfile();
    
    if (storedUser) {
      SIMULATED_USER = storedUser;
    } else {
      throw new ApiError('Unauthorized', 401);
    }
  }
  
  const missingFields: string[] = [];
  const requiredScreens: ('confirmation' | 'brands' | 'styles')[] = [];
  
  if (!SIMULATED_USER.stylePreference) {
    missingFields.push('stylePreference');
    requiredScreens.push('confirmation');
  }
  
  if (!SIMULATED_USER.selectedBrands || SIMULATED_USER.selectedBrands.length === 0) {
    missingFields.push('selectedBrands');
    requiredScreens.push('brands');
  }
  
  if (!SIMULATED_USER.favoriteStyles || SIMULATED_USER.favoriteStyles.length === 0) {
    missingFields.push('favoriteStyles');
    requiredScreens.push('styles');
  }
  
  const isComplete = missingFields.length === 0;
  SIMULATED_USER.isProfileComplete = isComplete;
  
  // Update stored user profile
  await storeUserProfile(SIMULATED_USER);
  
  return simulateApiResponse({
    isComplete,
    missingFields,
    requiredScreens
  });
};

export const simulateUpdateStylePreference = async (
  stylePreference: 'option1' | 'option2'
): Promise<UserProfile> => {
  if (!SIMULATED_USER) {
    // Try to load from storage first
    const storedUser = await retrieveUserProfile();
    
    if (storedUser) {
      SIMULATED_USER = storedUser;
    } else {
      throw new ApiError('Unauthorized', 401);
    }
  }
  
  SIMULATED_USER = {
    ...SIMULATED_USER,
    stylePreference,
    updatedAt: new Date().toISOString()
  };
  
  // Update stored user profile
  await storeUserProfile(SIMULATED_USER);
  
  return simulateApiResponse(SIMULATED_USER);
};

export const simulateUpdateSelectedBrands = async (
  selectedBrands: string[]
): Promise<UserProfile> => {
  if (!SIMULATED_USER) {
    // Try to load from storage first
    const storedUser = await retrieveUserProfile();
    
    if (storedUser) {
      SIMULATED_USER = storedUser;
    } else {
      throw new ApiError('Unauthorized', 401);
    }
  }
  
  SIMULATED_USER = {
    ...SIMULATED_USER,
    selectedBrands,
    updatedAt: new Date().toISOString()
  };
  
  // Update stored user profile
  await storeUserProfile(SIMULATED_USER);
  
  return simulateApiResponse(SIMULATED_USER);
};

export const simulateUpdateFavoriteStyles = async (
  favoriteStyles: string[]
): Promise<UserProfile> => {
  if (!SIMULATED_USER) {
    // Try to load from storage first
    const storedUser = await retrieveUserProfile();
    
    if (storedUser) {
      SIMULATED_USER = storedUser;
    } else {
      throw new ApiError('Unauthorized', 401);
    }
  }
  
  SIMULATED_USER = {
    ...SIMULATED_USER,
    favoriteStyles,
    isProfileComplete: true, // Mark profile as complete after setting favorite styles
    updatedAt: new Date().toISOString()
  };
  
  // Update stored user profile
  await storeUserProfile(SIMULATED_USER);
  
  return simulateApiResponse(SIMULATED_USER);
};

// Product simulation functions
export const simulateGetProducts = async (params?: Record<string, any>): Promise<{ results: Product[] }> => {
  // Clone the products to avoid modifying the original
  let products = [...MOCK_PRODUCTS];
  
  // Apply filters if provided
  if (params) {
    if (params.brand) {
      products = products.filter(product => product.brand.toLowerCase() === params.brand.toLowerCase());
    }
    
    if (params.style) {
      products = products.filter(product => product.styles.includes(params.style));
    }
    
    if (params.search) {
      const searchTermLower = params.search.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchTermLower) || 
        product.description.toLowerCase().includes(searchTermLower)
      );
    }
    
    // Sort products
    if (params.sort) {
      if (params.sort === 'price_asc') {
        products.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      } else if (params.sort === 'price_desc') {
        products.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      }
      // Add more sorting options as needed
    }
  }
  
  return simulateApiResponse({ results: products });
};

export const simulateGetProductDetails = async (id: number): Promise<Product> => {
  const product = MOCK_PRODUCTS.find(p => p.id === id);
  
  if (!product) {
    throw new ApiError('Product not found', 404);
  }
  
  return simulateApiResponse(product);
};

export const simulateGetBrands = async (): Promise<Brand[]> => {
  const brands: Brand[] = BRAND_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    logo: `https://example.com/brands/${name.toLowerCase().replace(/\s+/g, '-')}.png`,
    description: `${name} - описание бренда`
  }));
  
  return simulateApiResponse(brands);
};

export const simulateGetStyles = async (): Promise<Style[]> => {
  return simulateApiResponse(POPULAR_STYLES);
};

// Recommendation simulation functions
export const simulateGetRecommendations = async (): Promise<Recommendations> => {
  if (!SIMULATED_USER) {
    // Try to load from storage first
    const storedUser = await retrieveUserProfile();
    
    if (storedUser) {
      SIMULATED_USER = storedUser;
    } else {
      throw new ApiError('Unauthorized', 401);
    }
  }
  
  // Create personalized recommendations based on user preferences
  let styleBasedProducts: Product[] = [];
  let brandBasedProducts: Product[] = [];
  
  // Style-based recommendations
  if (SIMULATED_USER.favoriteStyles && SIMULATED_USER.favoriteStyles.length > 0) {
    styleBasedProducts = MOCK_PRODUCTS.filter(product => 
      product.styles.some(style => SIMULATED_USER!.favoriteStyles!.includes(style))
    );
  } else {
    // Fallback to some default products
    styleBasedProducts = MOCK_PRODUCTS.slice(0, 2);
  }
  
  // Brand-based recommendations
  if (SIMULATED_USER.selectedBrands && SIMULATED_USER.selectedBrands.length > 0) {
    brandBasedProducts = MOCK_PRODUCTS.filter(product => 
      SIMULATED_USER!.selectedBrands!.includes(product.brand)
    );
  } else {
    // Fallback to some default products
    brandBasedProducts = MOCK_PRODUCTS.slice(1, 3);
  }
  
  // Create shuffled copies for trending and new arrivals
  const shuffled = [...MOCK_PRODUCTS].sort(() => 0.5 - Math.random());
  
  return simulateApiResponse({
    based_on_style: styleBasedProducts,
    based_on_brands: brandBasedProducts,
    trending_now: shuffled.slice(0, 2),
    new_arrivals: shuffled.slice(2, 4)
  });
};

// Initialize simulated user from storage on module load
initSimulatedUser(); 