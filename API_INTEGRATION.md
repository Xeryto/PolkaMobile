# PolkaMobile API Integration

This document describes how the PolkaMobile app has been refactored to work with the new backend API.

## 🔄 **Changes Made**

### **1. Updated API Service (`app/services/api.ts`)**

- **New API Endpoints**: Updated to use `/api/v1/` prefix
- **Updated Interfaces**: Modified `UserProfile` interface to match new API structure
- **OAuth Support**: Added OAuth provider and login interfaces
- **Error Handling**: Improved error handling with FastAPI-style responses
- **Session Management**: Enhanced token and session management

### **2. Updated Authentication Storage (`app/authStorage.ts`)**

- **UserData Interface**: Updated to match new `UserProfile` structure
- **Field Names**: Changed from camelCase to snake_case to match API
- **Additional Fields**: Added support for `first_name`, `last_name`, etc.

### **3. Updated Login/Signup Screens**

- **LoginScreen**: Updated to use new API structure
- **SignupScreen**: Updated to use new API structure
- **Error Handling**: Improved error messages and validation

### **4. Configuration System (`app/services/config.ts`)**

- **Environment Switching**: Easy toggle between development and production
- **API Configuration**: Centralized API settings
- **Helper Functions**: Utilities for API function selection

## 🚀 **API Endpoints Used**

### **Authentication**

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout

### **User Management**

- `GET /api/v1/user/profile` - Get user profile
- `GET /api/v1/user/profile/completion-status` - Check profile completion

### **OAuth (Ready for Future Use)**

- `GET /api/v1/auth/oauth/providers` - Get OAuth providers
- `POST /api/v1/auth/oauth/login` - OAuth login

### **System**

- `GET /health` - Health check

## 🔧 **Configuration**

### **Development Mode (Default)**

```typescript
// app/services/config.ts
export const API_CONFIG = {
  USE_REAL_API: false, // Uses simulated API
  API_BASE_URL: "http://localhost:8000",
  // ...
};
```

### **Production Mode**

```typescript
// app/services/config.ts
export const API_CONFIG = {
  USE_REAL_API: true, // Uses real API
  API_BASE_URL: "https://your-api-domain.com",
  // ...
};
```

## 📱 **App Features**

### **Current Implementation**

- ✅ User registration and login
- ✅ Session management with JWT tokens
- ✅ Profile completion tracking
- ✅ Cart persistence (in memory)
- ✅ Product browsing (simulated data)

### **Ready for Backend Integration**

- ✅ OAuth social login
- ✅ Real product API integration
- ✅ User preferences management
- ✅ Recommendations system

## 🧪 **Testing**

### **Development Testing**

The app currently uses simulated API responses for development:

```typescript
// Demo credentials
Email: demo@example.com
Password: password123
```

### **API Testing**

To test with the real backend:

1. Start the FastAPI backend server
2. Set `USE_REAL_API: true` in `app/services/config.ts`
3. Update `API_BASE_URL` to your server URL
4. Test registration and login flows

## 🔄 **Migration Guide**

### **From Old API to New API**

1. **Update API URLs**: All endpoints now use `/api/v1/` prefix
2. **Update Response Fields**:
   - `expiresAt` → `expires_at`
   - `isProfileComplete` → `is_profile_complete`
   - `createdAt` → `created_at`
   - `updatedAt` → `updated_at`
3. **Update User Fields**:
   - `name` → `username`
   - Added `first_name`, `last_name` support

### **Backend Requirements**

The app expects a FastAPI backend with:

- JWT authentication
- PostgreSQL database
- CORS enabled for React Native
- Proper error responses with `detail` field

## 🚀 **Deployment**

### **Development**

```bash
# Start the app with simulated API
npm start
```

### **Production**

```bash
# 1. Update config to use real API
# 2. Build the app
expo build:android
expo build:ios
```

## 📋 **TODO**

- [ ] Implement real product API integration
- [ ] Add OAuth social login buttons
- [ ] Implement push notifications
- [ ] Add offline support
- [ ] Implement real-time cart sync
- [ ] Add payment gateway integration

## 🔗 **Related Files**

- `app/services/api.ts` - Main API service
- `app/services/config.ts` - API configuration
- `app/authStorage.ts` - Authentication storage
- `app/screens/LoginScreen.tsx` - Login screen
- `app/screens/SignupScreen.tsx` - Signup screen
- `App.tsx` - Main app component

## 📞 **Support**

For questions about the API integration, check:

1. The FastAPI backend documentation
2. The API specification in `django_api_specification.md`
3. The simulated API functions in `app/services/api.ts`
