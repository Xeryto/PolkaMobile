import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storing auth data
const AUTH_TOKEN_KEY = 'PolkaMobile_authToken';
const USER_DATA_KEY = 'PolkaMobile_userData';
const IS_LOGGED_IN_KEY = 'PolkaMobile_isLoggedIn';

export interface UserData {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_profile_complete: boolean;
  style_preference?: 'option1' | 'option2';
  selected_brands?: string[];
  favorite_styles?: string[];
  created_at: string;
  updated_at: string;
}

// Store authentication token securely
export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing auth token:', error);
    throw error;
  }
};

// Get the stored authentication token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Store user data
export const storeUserData = async (userData: UserData): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

// Get stored user data
export const getUserData = async (): Promise<UserData | null> => {
  try {
    const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
    return userDataString ? JSON.parse(userDataString) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Set logged in status
export const setLoggedIn = async (isLoggedIn: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(IS_LOGGED_IN_KEY, JSON.stringify(isLoggedIn));
  } catch (error) {
    console.error('Error storing login status:', error);
    throw error;
  }
};

// Check if user is logged in
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(IS_LOGGED_IN_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error getting login status:', error);
    return false;
  }
};

// Handle login (store all required data)
export const login = async (token: string, userData: UserData): Promise<void> => {
  try {
    await Promise.all([
      storeAuthToken(token),
      storeUserData(userData),
      setLoggedIn(true)
    ]);
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

// Handle logout (clear all auth data)
export const logout = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_DATA_KEY),
      setLoggedIn(false)
    ]);
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
}; 