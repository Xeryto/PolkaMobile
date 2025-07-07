import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

// API Configuration
export const API_CONFIG = {
  // Set to true to use real API endpoints, false to use simulated endpoints
  USE_REAL_API: true,
  
  // API Base URL - update this for production
  API_BASE_URL: ENV_API_BASE_URL || 'http://localhost:8000',
  
  // Development settings
  DEV: {
    // Simulated API delay in milliseconds
    API_DELAY: 500,
    
    // Demo credentials for testing
    DEMO_EMAIL: 'demo@example.com',
    DEMO_PASSWORD: 'password123',
  },
  
  // Production settings
  PROD: {
    // Real API timeout in milliseconds
    API_TIMEOUT: 10000,
  },

  // SSL Pinning Configuration
  SSL_PINNING_CONFIG: {
    // Add your server's SSL certificate hashes here
    // Example: 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
    CERTIFICATES: [],
  }
};

// Helper function to get the appropriate API function
export const getApiFunction = (simulatedFn: any, realFn: any) => {
  return API_CONFIG.USE_REAL_API ? realFn : simulatedFn;
};

// Environment detection
export const isDevelopment = () => {
  return __DEV__;
};

export const isProduction = () => {
  return !__DEV__;
}; 