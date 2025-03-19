import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as authStorage from '../authStorage';

interface LoginScreenProps {
  onLogin: () => void;
  onBack: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onBack }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    usernameOrEmail: '',
    password: '',
    general: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Validate form
  const validateForm = () => {
    let valid = true;
    const newErrors = { usernameOrEmail: '', password: '', general: '' };
    
    // Validate username/email
    if (!usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = 'Username or email is required';
      valid = false;
    }
    
    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  // Handle login
  const handleLoginPress = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, you would make an API call here
      // For demo purposes, we'll simulate a successful login after a delay
      setTimeout(async () => {
        // Simulating user data
        const userData = {
          id: '1',
          name: usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail,
          email: usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@example.com`,
        };
        
        // Store auth data
        await authStorage.login('fake-token-123', userData);
        
        setIsLoading(false);
        onLogin(); // Notify parent component
      }, 1500);
      
    } catch (error) {
      setIsLoading(false);
      setErrors({
        ...errors,
        general: 'Login failed. Please check your credentials and try again.'
      });
    }
  };
  
  return (
    <LinearGradient
      colors={[
        '#FAE9CF',
        '#CCA479',
        '#CDA67A',
        '#6A462F'
      ]}
      locations={[0, 0.34, 0.50, 0.87]}
      style={styles.container}
      start={{ x: 0, y: 0.2 }}
      end={{ x: 1, y: 0.8 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View 
              entering={FadeIn.duration(800)}
              style={styles.formContainer}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              
              <Text style={styles.headerText}>Log In</Text>
              
              {errors.general ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorGeneralText}>{errors.general}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username or Email</Text>
                <TextInput
                  style={[styles.input, errors.usernameOrEmail ? styles.inputError : null]}
                  placeholder="Enter your username or email"
                  placeholderTextColor="rgba(105, 70, 47, 0.5)"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={usernameOrEmail}
                  onChangeText={setUsernameOrEmail}
                />
                {errors.usernameOrEmail ? (
                  <Text style={styles.errorText}>{errors.usernameOrEmail}</Text>
                ) : null}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={[styles.input, errors.password ? styles.inputError : null]}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(105, 70, 47, 0.5)"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
              </View>
              
              <TouchableOpacity
                style={[styles.loginButton, isLoading ? styles.loginButtonDisabled : null]}
                onPress={handleLoginPress}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
  },
  backButtonText: {
    fontFamily: 'REM',
    fontSize: 16,
    color: 'white',
  },
  headerText: {
    fontFamily: 'IgraSans',
    fontSize: 32,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'REM',
    fontSize: 14,
    color: 'white',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'REM',
    fontSize: 16,
    color: '#4A3120',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputError: {
    borderColor: 'rgba(255, 100, 100, 0.7)',
  },
  errorText: {
    fontFamily: 'REM',
    fontSize: 12,
    color: '#FF6464',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 100, 100, 0.2)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorGeneralText: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#FF6464',
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: 'rgba(205, 166, 122, 0.8)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: 'rgba(205, 166, 122, 0.4)',
  },
  loginButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 18,
    color: 'white',
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontFamily: 'REM',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default LoginScreen; 