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
import Logo from '../assets/Logo.svg';
import VK from '../assets/VK.svg';
import { Dimensions } from 'react-native';
import * as api from '../services/api';

const { width, height } = Dimensions.get('window');

const LOGO_SIZE = Math.min(width, height) * 0.3; // 25% of the smallest dimension

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
      // Use the simulated API for development
      // Determine if input is email or username
      const isEmail = usernameOrEmail.includes('@');
      const email = isEmail ? usernameOrEmail : `${usernameOrEmail}@example.com`;
      
      const response = await api.simulateLogin(email, password);
      
      setIsLoading(false);
      onLogin(); // Notify parent component
    } catch (error) {
      setIsLoading(false);
      
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors({
        ...errors,
        general: errorMessage
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
              
              <View 
							style={styles.logoContainer}>
							  <Logo width={LOGO_SIZE} height={LOGO_SIZE} />
						  </View>
              
              {errors.general ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorGeneralText}>{errors.general}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputShadow}>
                <View style={styles.inputContainer}>
                  <TextInput
                  style={[styles.input, errors.usernameOrEmail ? styles.inputError : null]}
                  placeholder="Ник/Email"
                  placeholderTextColor="rgba(0, 0, 0, 1)"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                  value={usernameOrEmail}
                  onChangeText={setUsernameOrEmail}
                  />
              </View>
              {errors.usernameOrEmail ? (
                  <Text style={styles.errorText}>{errors.usernameOrEmail}</Text>
                ) : null}
              </View>
              
              <View style={styles.inputShadow}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.password ? styles.inputError : null]}
                    placeholder="Пароль"
                    placeholderTextColor="rgba(0, 0, 0, 1)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
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
                  <Text style={styles.loginButtonText}>Войти</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.forgotPasswordButton}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.vkButton} onPress={() => Alert.alert('VK Login', 'VK login will be implemented in a future update.')}>
                  <VK width={30} height={30} />
                </TouchableOpacity>
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
    height: '100%',
    backgroundColor: '#F2ECE7',
    borderRadius: 41,
    padding: 24,
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    //overflow: 'hidden',
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
    color: '#000',
  },
  inputContainer: {
    borderRadius: 41,
    overflow: 'hidden',
    backgroundColor: '#E0D6CC'
  },
  inputShadow: {
    borderRadius: 41,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    marginBottom: 20,
  },
  input: {
    borderRadius: 41,
    paddingHorizontal: 16,
    paddingVertical: 20,
    fontFamily: 'IgraSans',
    fontSize: 14,
    ...Platform.select({
      android: {
        overflow: 'hidden',
      },
    }),
  },
  inputError: {
    borderColor: 'rgba(255, 100, 100, 0.7)',
    borderWidth: 1,
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
    backgroundColor: '#4A3120',
    borderRadius: 41,
    paddingVertical: 22,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: 'rgba(205, 166, 122, 0.4)',
  },
  loginButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#F2ECE7',
  },
  forgotPasswordButton: {
    alignSelf: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontFamily: 'REM',
    fontSize: 12,
    color: '#000',
    textDecorationLine: 'underline',
  },
  logoContainer: {
		alignItems: 'center',
		justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    marginBottom: 120,
	},
  socialContainer: {
    marginTop: 20,
    //marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vkButton: {
    width: 69,
    height: 69,
    borderRadius: 41,
    backgroundColor: '#E0D6CC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    //overflow: 'hidden',
  },
});

export default LoginScreen;