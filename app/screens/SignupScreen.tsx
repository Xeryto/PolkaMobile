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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Logo from '../assets/Logo.svg';
import VK from '../assets/VK.svg';
import BackIcon from '../assets/Back.svg';
import InfoIcon from '../assets/InfoIcon.svg';
import CheckboxChecked from '../assets/CheckboxChecked.svg';
import CheckboxUnchecked from '../assets/CheckboxUnchecked.svg';
import { Dimensions } from 'react-native';
import * as api from '../services/api';

const { width, height } = Dimensions.get('window');

interface SignupScreenProps {
  onSignup: () => void;
  onBack: () => void;
}

const LOGO_SIZE = Math.min(width, height) * 0.3; // 25% of the smallest dimension

const SignupScreen: React.FC<SignupScreenProps> = ({ onSignup, onBack }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
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

    const illegalCharRegex = /[^a-zA-Z0-9#$-_!]/; // Only allow letters, numbers, and #$-_!
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
    
    // Validate username
    if (!username.trim()) {
      newErrors.username = 'Ник обязателен';
      valid = false;
    } else if (username.trim().length < 3) {
      newErrors.username = 'Ник должен быть не менее 3 символов';
      valid = false;
    } else if (username.includes(' ')) {
      newErrors.username = 'Ник не должен содержать пробелов';
      valid = false;
    } else if (illegalCharRegex.test(username)) {
      newErrors.username = 'Ник содержит недопустимые символы';
      valid = false;
    }
    
    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email обязателен';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email некорректен';
      valid = false;
    } else if (email.includes(' ')) {
      newErrors.email = 'Email не должен содержать пробелов';
      valid = false;
    } else if (illegalCharRegex.test(email)) {
      newErrors.email = 'Email содержит недопустимые символы';
      valid = false;
    }
    
    // Validate password
    if (!password) {
      newErrors.password = 'Пароль обязателен';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
      valid = false;
    } else if (!passwordRegex.test(password)) {
      newErrors.password = 'Пароль должен содержать буквы и цифры';
      valid = false;
    } else if (password.includes(' ')) {
      newErrors.password = 'Пароль не должен содержать пробелов';
      valid = false;
    } else if (illegalCharRegex.test(password)) {
      newErrors.password = 'Пароль содержит недопустимые символы';
      valid = false;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
      valid = false;
    }
    
    // Validate terms acceptance
    if (!termsAccepted) {
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
      // Use the new API for registration
      const response = await api.registerUser(username, email, password);
      
      setIsLoading(false);
      onSignup(); // Notify parent component
    } catch (error) {
      setIsLoading(false);
      
      let errorMessage = 'Ошибка регистрации. Попробуйте позже.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setErrors({
        ...errors,
        general: errorMessage
      });
    }
  };

  // Toggle terms modal
  const handleInfoPress = () => {
    setShowTermsModal(true);
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
              style={styles.formContainer}
            >
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <BackIcon width={33} height={33} />
              </TouchableOpacity>
              
              <View 
							style={styles.logoContainer}
						>
							<Logo width={LOGO_SIZE} height={LOGO_SIZE} />
						</View>
              
              {errors.general ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorGeneralText}>{errors.general}</Text>
                </View>
              ) : null}
              
              <Animated.View style={styles.inputShadow} entering={FadeInDown.duration(500).delay(50)}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.username ? styles.inputError : null]}
                    placeholder="Ник"
                    placeholderTextColor="rgba(0, 0, 0, 1)"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                  />
                </View>
                {errors.username ? (
                  <Text style={styles.errorText}>{errors.username}</Text>
                ) : null}
              </Animated.View>
              
              <Animated.View style={styles.inputShadow} entering={FadeInDown.duration(500).delay(100)}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.email ? styles.inputError : null]}
                    placeholder="Email"
                    placeholderTextColor="rgba(0, 0, 0, 1)"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}
              </Animated.View>
              
              <Animated.View style={styles.inputShadow} entering={FadeInDown.duration(500).delay(150)}>
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
              </Animated.View>
              
              <Animated.View style={styles.inputShadow} entering={FadeInDown.duration(500).delay(200)}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
                    placeholder="Повторите пароль"
                    placeholderTextColor="rgba(0, 0, 0, 1)"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
              </Animated.View>
              
              
                <TouchableOpacity
                style={[{alignItems: 'center',
                  marginTop: 10, width: '100%'}]}
                  onPress={handleSignupPress}
                  disabled={isLoading || !termsAccepted}
                >
                  <Animated.View 
                style={
                  [styles.signupButton, isLoading || !termsAccepted ? styles.signupButtonDisabled : null]} 
                entering={FadeInDown.duration(500).delay(250)}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.signupButtonText}>Зарегистрироваться</Text>
                )}
                </Animated.View>
              </TouchableOpacity>
              
              <Animated.View style={styles.termsContainer} entering={FadeInDown.duration(500).delay(300)}>
                <View style={styles.termsRow}>
                  <TouchableOpacity onPress={handleInfoPress}>
                    <InfoIcon width={15} height={15} />
                  </TouchableOpacity>
                  
                  <Text style={styles.termsText}>
                    Соглашаюсь с{' '}
                    <Text 
                      style={styles.termsLink} 
                      onPress={() => Alert.alert('Условия', 'Здесь будут отображены условия использования.')}
                    >
                      Условиями использования
                    </Text>
                    {' '}и{' '}
                    <Text 
                      style={styles.termsLink}
                      onPress={() => Alert.alert('Политика', 'Здесь будет отображена политика конфиденциальности.')}
                    >
                      Политикой конфиденциальности
                    </Text>
                  </Text>
                  
                  <TouchableOpacity 
                    onPress={() => setTermsAccepted(!termsAccepted)} 
                    style={styles.checkboxContainer}
                  >
                    {termsAccepted ? (
                      <CheckboxChecked width={20} height={20} />
                    ) : (
                      <CheckboxUnchecked width={20} height={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View style={styles.socialContainer} entering={FadeInDown.duration(500).delay(350)}>
                <TouchableOpacity style={styles.vkButton} onPress={() => Alert.alert('VK Login', 'VK login will be implemented in a future update.')}>
                  <VK width={30} height={30} />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      {/* Terms and Conditions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTermsModal}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Условия и Политика</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>
                <Text style={styles.modalSubtitle}>Условия использования:</Text>{'\n\n'}
                Используя наше приложение, вы соглашаетесь соблюдать данные условия использования. 
                Приложение предоставляется "как есть" без каких-либо гарантий. 
                Мы оставляем за собой право изменять условия в любое время.{'\n\n'}
                
                <Text style={styles.modalSubtitle}>Политика конфиденциальности:</Text>{'\n\n'}
                Мы собираем только необходимые данные для функционирования приложения.
                Ваши личные данные защищены и не передаются третьим лицам без вашего согласия.
                Вы можете запросить удаление своих данных в любое время.
              </Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
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
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginLeft: 16,
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
  signupButtonDisabled: {
    backgroundColor: 'rgba(205, 166, 122, 0.4)',
  },
  signupButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 20,
    color: '#F2ECE7',
  },
  termsContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
    paddingHorizontal: 5,
  },
  termsText: {
    fontFamily: 'IgraSans',
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.8)',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  termsLink: {
    fontFamily: 'IgraSans',
    fontSize: 10,
    color: '#000',
    textDecorationLine: 'underline',
  },
  checkboxContainer: {
    padding: 5,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#F2ECE7',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: 'IgraSans',
    fontSize: 18,
    color: '#4A3120',
    marginBottom: 15,
  },
  modalScroll: {
    width: '100%',
    marginBottom: 15,
  },
  modalText: {
    fontFamily: 'REM',
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modalSubtitle: {
    fontFamily: 'IgraSans',
    fontSize: 16,
    color: '#4A3120',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#4A3120',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  modalCloseButtonText: {
    fontFamily: 'IgraSans',
    fontSize: 16,
    color: '#F2ECE7',
  },
});

export default SignupScreen;