import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API configuration
const API_URL = API_CONFIG.API_BASE_URL;
const SESSION_TOKEN_KEY = 'PolkaMobile_sessionToken';
const SESSION_REFRESH_TOKEN_KEY = 'PolkaMobile_refreshToken';
const SESSION_EXPIRY_KEY = 'PolkaMobile_sessionExpiry';
const USER_PROFILE_KEY = 'PolkaMobile_userProfile';

// Session management events
export type SessionEvent = 'token_expired' | 'token_refreshed' | 'session_cleared' | 'login_required';

// Session event listener type
export type SessionEventListener = (event: SessionEvent) => void;

// Session manager class
class SessionManager {
  private listeners: SessionEventListener[] = [];
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  // Add event listener
  addListener(listener: SessionEventListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Emit event to all listeners
  private emit(event: SessionEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  // Check if token is expired or will expire soon (within 5 minutes)
  private isTokenExpiredOrExpiringSoon(expiryDate: Date): boolean {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    return expiryDate <= fiveMinutesFromNow;
  }

  // Refresh token
  async refreshToken(): Promise<string> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync(SESSION_REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await refreshAuthToken(refreshToken);
        await this.storeSession(response.token, response.expires_at, response.refresh_token);
        this.emit('token_refreshed');
        return response.token;
      } catch (error) {
        await this.clearSession();
        this.emit('login_required');
        throw new Error('Token refresh failed');
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Store session
  async storeSession(token: string, expiresAt: string, refreshToken?: string) {
    try {
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
      await SecureStore.setItemAsync(SESSION_EXPIRY_KEY, expiresAt);
      if (refreshToken) {
        await SecureStore.setItemAsync(SESSION_REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error('Error storing session:', error);
      throw error;
    }
  }

  // Get current session with automatic refresh
  async getValidSession(): Promise<{ token: string | null, isValid: boolean }> {
    try {
      const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
      const expiryString = await SecureStore.getItemAsync(SESSION_EXPIRY_KEY);
      
      if (!token || !expiryString) {
        return { token: null, isValid: false };
      }
      
      const expiryDate = new Date(expiryString);
      
      if (this.isTokenExpiredOrExpiringSoon(expiryDate)) {
        try {
          const newToken = await this.refreshToken();
          return { token: newToken, isValid: true };
        } catch (error) {
          return { token: null, isValid: false };
        }
      }
      
      return { token, isValid: true };
    } catch (error) {
      console.error('Error getting session:', error);
      return { token: null, isValid: false };
    }
  }

  // Clear session
  async clearSession() {
    try {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
      await SecureStore.deleteItemAsync(SESSION_REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(SESSION_EXPIRY_KEY);
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      this.emit('session_cleared');
    } catch (error) {
      console.error('Error clearing session:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const { isValid } = await this.getValidSession();
    return isValid;
  }

  // Public method to handle login required
  handleLoginRequired() {
    this.emit('login_required');
  }
}

// Create global session manager instance
export const sessionManager = new SessionManager();

// Updated User profile interfaces to match new API
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  gender?: 'male' | 'female';
  selected_size?: string;
  is_profile_complete: boolean;
  favorite_brands: Brand[];
  favorite_styles: Style[];
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  expires_at: string;
  refresh_token: string;
  user: UserProfile;
}

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  requiredScreens: ('confirmation' | 'brands' | 'styles')[];
}

// OAuth interfaces
export interface OAuthProvider {
  provider: string;
  client_id: string;
  redirect_url: string;
  scope: string;
}

export interface OAuthLoginRequest {
  provider: string;
  token: string;
}

// Product interfaces (keeping existing ones)
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
      data.detail || data.message || 'An error occurred',
      response.status
    );
  }
  
  return data;
};

// API request helper with automatic token refresh
const apiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  requireAuth: boolean = true
) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (requireAuth) {
    const session = await sessionManager.getValidSession();
    if (!session.isValid) {
      throw new ApiError('Authentication required', 401);
    }
    headers['Authorization'] = `Bearer ${session.token}`;
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
    
    if (response.status === 401 && requireAuth) {
      await sessionManager.clearSession();
      sessionManager.handleLoginRequired();
    }
    
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

// Legacy functions for backward compatibility
export const storeSession = async (token: string, expiresAt: string, refreshToken?: string) => {
  await sessionManager.storeSession(token, expiresAt, refreshToken);
};

export const getSession = async (): Promise<{ token: string | null, isValid: boolean }> => {
  return await sessionManager.getValidSession();
};

export const clearSession = async () => {
  await sessionManager.clearSession();
};

// User profile persistence
export const storeUserProfile = async (profile: UserProfile) => {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error storing user profile:', error);
    throw error;
  }
};

export const retrieveUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const profileString = await AsyncStorage.getItem(USER_PROFILE_KEY);
    return profileString ? JSON.parse(profileString) : null;
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    return null;
  }
};

// Updated Authentication API functions
export const registerUser = async (
  username: string,
  email: string,
  password: string,
  first_name?: string,
  last_name?: string
): Promise<AuthResponse> => {
  const response = await apiRequest('/api/v1/auth/register', 'POST', {
    username,
    email,
    password,
    first_name,
    last_name
  }, false);

  // Store session
  await sessionManager.storeSession(
    response.token,
    response.expires_at,
    response.refresh_token
  );

  // Store user profile
  await storeUserProfile(response.user);

  return response;
};

export const loginUser = async (
  identifier: string, // Can be username or email
  password: string
): Promise<AuthResponse> => {
  const response = await apiRequest('/api/v1/auth/login', 'POST', {
    identifier, // Backend should handle both username and email
    password
  }, false);

  // Store session
  await sessionManager.storeSession(
    response.token,
    response.expires_at,
    response.refresh_token
  );

  // Store user profile
  await storeUserProfile(response.user);
  
  return response;
};

export const logoutUser = async (): Promise<void> => {
  try {
    // Call logout endpoint to invalidate tokens on server
    await apiRequest('/api/v1/auth/logout', 'POST');
  } catch (error) {
    console.error('Error calling logout endpoint:', error);
    // Continue with local logout even if server call fails
  } finally {
    // Always clear local session
    await sessionManager.clearSession();
  }
};

export const refreshAuthToken = async (refreshToken: string): Promise<AuthResponse> => {
    return await apiRequest('/api/v1/auth/refresh', 'POST', {
        refresh_token: refreshToken
    }, false);
}

// OAuth functions
export const getOAuthProviders = async (): Promise<OAuthProvider[]> => {
  return await apiRequest('/api/v1/auth/oauth/providers', 'GET', undefined, false);
};

export const oauthLogin = async (provider: string, token: string): Promise<AuthResponse> => {
  const response = await apiRequest('/api/v1/auth/oauth/login', 'POST', {
    provider,
    token
  }, false);

  // Store session
  await sessionManager.storeSession(
    response.token,
    response.expires_at,
    response.refresh_token
  );

  // Store user profile
  await storeUserProfile(response.user);

  return response;
};

// Updated User profile API functions
export const getCurrentUser = async (): Promise<UserProfile> => {
  return await apiRequest('/api/v1/user/profile', 'GET');
};

export const getProfileCompletionStatus = async (): Promise<ProfileCompletionStatus> => {
  return await apiRequest('/api/v1/user/profile/completion-status', 'GET');
};

export const getOAuthAccounts = async (): Promise<any[]> => {
  return await apiRequest('/api/v1/user/oauth-accounts', 'GET');
};

// NEW: User preference update functions
export const updateUserProfile = async (
  gender?: 'male' | 'female',
  selected_size?: string,
  first_name?: string,
  last_name?: string
): Promise<UserProfile> => {
  const updateData: any = {};
  
  if (gender !== undefined) updateData.gender = gender;
  if (selected_size !== undefined) updateData.selected_size = selected_size;
  if (first_name !== undefined) updateData.first_name = first_name;
  if (last_name !== undefined) updateData.last_name = last_name;

  const response = await apiRequest('/api/v1/user/profile', 'PUT', updateData);
  
  // Update stored profile
  await storeUserProfile(response);
  
  return response;
};

export const updateUserBrands = async (brandIds: number[]): Promise<any> => {
  const response = await apiRequest('/api/v1/user/brands', 'POST', {
    brand_ids: brandIds
  });
  
  // Refresh user profile to get updated data
  const updatedProfile = await getCurrentUser();
  await storeUserProfile(updatedProfile);
  
  return response;
};

export const updateUserStyles = async (styleIds: string[]): Promise<any> => {
  const response = await apiRequest('/api/v1/user/styles', 'POST', {
    style_ids: styleIds
  });
  
  // Refresh user profile to get updated data
  const updatedProfile = await getCurrentUser();
  await storeUserProfile(updatedProfile);
  
  return response;
};

// NEW: Brand and Style API functions
export const getBrands = async (): Promise<Brand[]> => {
  return await apiRequest('/api/v1/brands', 'GET', undefined, false);
};

export const getStyles = async (): Promise<Style[]> => {
  return await apiRequest('/api/v1/styles', 'GET', undefined, false);
};

// Friends interfaces
export interface FriendRequest {
  id: string;
  recipient?: {
    id: string;
    username: string;
  };
  sender?: {
    id: string;
    username: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Friend {
  id: string;
  username: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
}

export interface SearchUser {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  friend_status?: 'friend' | 'request_received' | 'request_sent' | 'not_friend';
}

export interface FriendRequestResponse {
  message: string;
  request_id?: string; // Add optional request_id field
}

// Friends API functions
export const sendFriendRequest = async (recipientUsername: string): Promise<FriendRequestResponse> => {
  console.log('Sending friend request to username:', recipientUsername);
  const requestBody = {
    recipient_identifier: recipientUsername
  };
  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  
  return await apiRequest('/api/v1/friends/request', 'POST', requestBody);
};

export const getSentFriendRequests = async (): Promise<FriendRequest[]> => {
  return await apiRequest('/api/v1/friends/requests/sent', 'GET');
};

export const getReceivedFriendRequests = async (): Promise<FriendRequest[]> => {
  return await apiRequest('/api/v1/friends/requests/received', 'GET');
};

export const acceptFriendRequest = async (requestId: string): Promise<FriendRequestResponse> => {
  return await apiRequest(`/api/v1/friends/requests/${requestId}/accept`, 'POST');
};

export const rejectFriendRequest = async (requestId: string): Promise<FriendRequestResponse> => {
  return await apiRequest(`/api/v1/friends/requests/${requestId}/reject`, 'POST');
};

export const cancelFriendRequest = async (requestId: string): Promise<FriendRequestResponse> => {
  return await apiRequest(`/api/v1/friends/requests/${requestId}/cancel`, 'DELETE');
};

export const getFriends = async (): Promise<Friend[]> => {
  return await apiRequest('/api/v1/friends', 'GET');
};

export const searchUsers = async (query: string): Promise<SearchUser[]> => {
  if (query.length < 2) {
    return [];
  }
  return await apiRequest(`/api/v1/users/search?query=${encodeURIComponent(query)}`, 'GET');
};

// Public user profile interface
export interface PublicUserProfile {
  id: string;
  username: string;
  gender: 'male' | 'female' | null;
}

// Get public profile of another user
export const getUserPublicProfile = async (userId: string): Promise<PublicUserProfile> => {
  return await apiRequest(`/api/v1/users/${userId}/profile`, 'GET');
};

// Remove a friend
export const removeFriend = async (friendId: string): Promise<FriendRequestResponse> => {
  return await apiRequest(`/api/v1/friends/${friendId}`, 'DELETE');
};

// Health check
export const healthCheck = async (): Promise<any> => {
  return await apiRequest('/health', 'GET', undefined, false);
};

// Toggle favorite (like/unlike) a product
export const toggleFavorite = async (productId: string, action: 'like' | 'unlike'): Promise<{ message: string }> => {
  return await apiRequest('/api/v1/user/favorites/toggle', 'POST', {
    product_id: productId,
    action,
  });
};

// Get recommendations for the current user
export interface RecommendationProduct {
  id: string;
  name: string;
  price: string;
  image_url: string | null;
  is_liked: boolean;
}

export const getUserRecommendations = async (): Promise<RecommendationProduct[]> => {
  return await apiRequest('/api/v1/recommendations/for_user', 'GET');
};

// Get recommendations for a friend
export interface FriendRecommendationProduct {
  id: string;
  name: string;
  price: string;
  image_url: string | null;
}

export const getFriendRecommendations = async (friendId: string): Promise<FriendRecommendationProduct[]> => {
  return await apiRequest(`/api/v1/recommendations/for_friend/${friendId}`, 'GET');
};

// Get user's favorite (liked) products
export const getUserFavorites = async (): Promise<RecommendationProduct[]> => {
  return await apiRequest('/api/v1/user/favorites', 'GET');
};

// Product search endpoint
export const getProductSearchResults = async (params: Record<string, any>): Promise<RecommendationProduct[]> => {
  // Build query string from params
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return await apiRequest(`/api/v1/products/search?${query}`, 'GET');
};

// Get all categories
export const getCategories = async (): Promise<any[]> => {
  return await apiRequest('/api/v1/categories', 'GET', undefined, false);
};