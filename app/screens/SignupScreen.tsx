import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
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

interface SignupScreenProps {
  onSignup: () => void;
  onBack: () => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ onSignup, onBack }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Validate form
  const validateForm = () => {
    let valid = true;
    const newErrors = { 
      username: '', 
      email: '', 
      password: '', 
      confirmPassword: '',
      general: '' 
    };
    
    // Validate username
    if (!username.trim()) {
      newErrors.username = 'Username is required';
      valid = false;
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      valid = false;
    }
    
    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
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
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }
    
    setErrors(newErrors);
    return valid;
  };
  
  // Handle signup
  const handleSignupPress = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, you would make an API call here
      // For demo purposes, we'll simulate a successful registration after a delay
      setTimeout(async () => {
        // Simulating user data
        const userData = {
          id: '1',
          name: username,
          email: email,
        };
        
        // Store auth data
        await authStorage.login('fake-token-123', userData);
        
        setIsLoading(false);
        onSignup(); // Notify parent component
      }, 1500);
      
    } catch (error) {
      setIsLoading(false);
      setErrors({
        ...errors,
        general: 'Registration failed. Please try again later.'
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
              
              <Text style={styles.headerText}>Create Account</Text>
              
              {errors.general ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorGeneralText}>{errors.general}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={[styles.input, errors.username ? styles.inputError : null]}
                  placeholder="Enter your username"
                  placeholderTextColor="rgba(105, 70, 47, 0.5)"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
                {errors.username ? (
                  <Text style={styles.errorText}>{errors.username}</Text>
                ) : null}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(105, 70, 47, 0.5)"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
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
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                  placeholder="Confirm your password"
                  placeholderTextColor="rgba(105, 70, 47, 0.5)"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
              </View>
              
              <TouchableOpacity
                style={[styles.signupButton, isLoading ? styles.signupButtonDisabled : null]}
                onPress={handleSignupPress}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signupButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By signing up, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
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
    marginBottom: 16,
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
  signupButton: {
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
  signupButtonDisabled: {
    backgroundColor: 'rgba(205, 166, 122, 0.4)',
  },
  signupButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 18,
    color: 'white',
  },
  termsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  termsText: {
    fontFamily: 'REM',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  termsLink: {
    fontFamily: 'REM',
    fontSize: 12,
    color: 'white',
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;