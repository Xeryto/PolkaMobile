import { useState, useEffect } from 'react';
import { sessionManager, SessionEvent } from '../services/api';

interface SessionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useSession = () => {
  const [sessionState, setSessionState] = useState<SessionState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Check initial authentication status
    const checkAuthStatus = async () => {
      try {
        const isAuth = await sessionManager.isAuthenticated();
        setSessionState({
          isAuthenticated: isAuth,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setSessionState({
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to check authentication status',
        });
      }
    };

    checkAuthStatus();

    // Listen for session events
    const unsubscribe = sessionManager.addListener((event: SessionEvent) => {
      switch (event) {
        case 'token_expired':
          setSessionState({
            isAuthenticated: false,
            isLoading: false,
            error: 'Session expired. Please log in again.',
          });
          break;
        case 'token_refreshed':
          setSessionState({
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          break;
        case 'session_cleared':
          setSessionState({
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          break;
        case 'login_required':
          setSessionState({
            isAuthenticated: false,
            isLoading: false,
            error: 'Please log in to continue.',
          });
          break;
      }
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      setSessionState(prev => ({ ...prev, isLoading: true }));
      await sessionManager.clearSession();
      setSessionState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setSessionState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to logout',
      }));
    }
  };

  const clearError = () => {
    setSessionState(prev => ({ ...prev, error: null }));
  };

  const login = () => {
    setSessionState({
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  };

  return {
    ...sessionState,
    login,
    logout,
    clearError,
  };
}; 