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
  Alert,
  Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Logo from '../assets/Logo.svg';
import BackIcon from '../assets/Back.svg';
import { Dimensions } from 'react-native';
import * as api from '../services/api';

const { width, height } = Dimensions.get('window');

const LOGO_SIZE = Math.min(width, height) * 0.3; // 25% of the smallest dimension

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Validate email
  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email обязателен');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email некорректен');
      return false;
    }
    
    setError('');
    return true;
  };
  
  // Handle reset password request
  const handleResetPress = async () => {
    if (!validateEmail()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call the API to initiate password reset
      const success = await api.simulateResetPassword(email);
      
      setIsLoading(false);
      
      if (success) {
        setIsSuccess(true);
      } else {
        setError('Не удалось отправить запрос. Попробуйте позже.');
      }
    } catch (error) {
      setIsLoading(false);
      
      let errorMessage = 'Ошибка восстановления. Попробуйте позже.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
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
              entering={FadeInDown.duration(500)}
              style={styles.roundedBox}
            >
                <LinearGradient
          colors={["rgba(205, 166, 122, 0.5)", "transparent"]}
          start={{ x: 0.1, y: 1 }}
          end={{ x: 0.9, y: 0.3 }}
          style={styles.gradientBackground}
        />
              <View style={styles.formContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <BackIcon width={33} height={33} />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <Logo width={LOGO_SIZE} height={LOGO_SIZE} />
              </View>
              
              {isSuccess ? (
                <Animated.View 
                  entering={FadeInDown.duration(500)}
                  style={styles.successContainer}
                >
                  <Text style={styles.successText}>
                    Инструкции по восстановлению пароля отправлены на ваш email.
                  </Text>
                  <Text style={styles.successSubtext}>
                    Проверьте папку "Входящие" и следуйте указанным инструкциям.
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.backToLoginButton}
                    onPress={onBack}
                  >
                    <Text style={styles.backToLoginText}>Вернуться к входу</Text>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <>
                  <Animated.View style={styles.inputShadow} entering={FadeInDown.duration(500).delay(50)}>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, error ? styles.inputError : null]}
                        placeholder="Email или ник"
                        placeholderTextColor="rgba(0, 0, 0, 1)"
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                      />
                    </View>
                    {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}
                  </Animated.View>
                  
                  <TouchableOpacity
                    style={[{
                      alignItems: 'center',
                      marginTop: 20,
                      width: '100%'
                    }, isLoading ? styles.resetButtonDisabled : null]}
                    onPress={handleResetPress}
                    disabled={isLoading}
                  >
                    <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.resetButton}>
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.resetButtonText}>Восстановить пароль</Text>
                      )}
                    </Animated.View>
                  </TouchableOpacity>
                </>
              )}
              </View>
              <View style={styles.textContainer}>
          <Text style={styles.text}>
            ЗАБЫЛИ ПАРОЛЬ
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
    alignItems: 'center',
  },
  formContainer: {
    width: width*0.88,
    height: '91%',
    backgroundColor: '#F2ECE7',
    borderRadius: 41,
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    top: -3,
    left: -3,
  },
  roundedBox: {
    width: width*0.88,
    height: '100%',
    borderRadius: 41,
    backgroundColor: 'rgba(205, 166, 122, 0)',
    position: 'relative',
    borderWidth: 3,
    borderColor: 'rgba(205, 166, 122, 0.4)',
  },
  gradientBackground: {
    borderRadius: 37,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    width: 33,
    height: 33,
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
    marginBottom: 40,
    marginTop: 40,
  },
  titleContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: 'IgraSans',
    fontSize: 28,
    color: '#4A3120',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#4A3120',
    textAlign: 'center',
    opacity: 0.8,
  },
  inputContainer: {
    borderRadius: 41,
    overflow: 'hidden',
    backgroundColor: '#E0D6CC',
    //paddingVertical: 8,
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
    paddingVertical: 28,
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
  errorContainer: {
    backgroundColor: 'rgba(255, 100, 100, 0.2)',
    padding: 10,
    borderRadius: 41,
  },
  errorText: {
    fontFamily: 'REM',
    fontSize: 12,
    color: '#FF6464',
    marginTop: 4,
  },
  resetButton: {
    backgroundColor: '#4A3120',
    borderRadius: 41,
    paddingVertical: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '100%',
    alignItems: 'center',
  },
  resetButtonDisabled: {
    backgroundColor: 'rgba(205, 166, 122, 0.4)',
  },
  resetButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#F2ECE7',
  },
  successContainer: {
    backgroundColor: 'rgba(144, 238, 144, 0.2)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: height*0.2,
  },
  successText: {
    fontFamily: 'IgraSans',
    fontSize: 18,
    color: '#4A3120',
    textAlign: 'center',
    marginBottom: 10,
  },
  successSubtext: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#4A3120',
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
  },
  backToLoginButton: {
    backgroundColor: '#CDA67A',
    borderRadius: 41,
    paddingVertical: 15,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    marginTop: 10,
  },
  backToLoginText: {
    fontFamily: 'IgraSans',
    fontSize: 16,
    color: '#FFFFFF',
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    marginBottom: 18,
    marginLeft: 27,
  },
  text: {
    fontFamily: 'Igra Sans',
    fontSize: 32,
    color: '#F2ECE7',
    textAlign: 'left',
  },
});

export default ForgotPasswordScreen; 