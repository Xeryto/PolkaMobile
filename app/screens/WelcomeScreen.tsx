import React, { useState, useEffect, useRef } from 'react';
import { 
	View, 
	Text, 
	StyleSheet, 
	Pressable, 
	Dimensions,
	Platform,
	SafeAreaView,
	Animated as RNAnimated,
	Easing,
	TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Logo from '../assets/Logo.svg';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';
import ConfirmationScreen from './ConfirmationScreen';
import BrandSearchScreen from './BrandSearchScreen';
import StylesSelectionScreen from './StylesSelectionScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';

interface WelcomeScreenProps {
	onLogin: () => void;
	onRegister: (stylePreference?: 'option1' | 'option2', selectedBrands?: string[], favoriteStyles?: string[]) => void;
}

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width, height) * 0.27; // 25% of the smallest dimension

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin, onRegister }) => {
	const [showLoginScreen, setShowLoginScreen] = useState(false);
	const [showSignupScreen, setShowSignupScreen] = useState(false);
	const [showForgotPasswordScreen, setShowForgotPasswordScreen] = useState(false);
	const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);
	const [showBrandSearchScreen, setShowBrandSearchScreen] = useState(false);
	const [showStylesSelectionScreen, setShowStylesSelectionScreen] = useState(false);
	const [selectedOption, setSelectedOption] = useState<'option1' | 'option2'>('option1');
	const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
	const [isReady, setIsReady] = useState(false);
	const [isSpinning, setIsSpinning] = useState(false);
	
	// Animated values for button spinning effect
	const borderSpinValue = useRef(new RNAnimated.Value(0)).current;
	const buttonScaleValue = useRef(new RNAnimated.Value(1)).current;
	
	// After initial mount, set ready state to true
	useEffect(() => {
		// Small delay to ensure the welcome screen is ready after the auth loading screen
		const timer = setTimeout(() => {
			setIsReady(true);
		}, 100);
		
		return () => clearTimeout(timer);
	}, []);
	
	// Handle login button press
	const handleLoginPress = () => {
		setShowLoginScreen(true);
	};

	// Handle forgot password button press
	const handleForgotPasswordPress = () => {
		setShowLoginScreen(false);
		setShowForgotPasswordScreen(true);
	};

	// Handle register button press with spinning border animation
	const handleRegisterPress = () => {
		if (isSpinning) return; // Prevent multiple presses during animation
		
		setIsSpinning(true);
		
		// Reset spin value to 0
		borderSpinValue.setValue(0);
		
		// Create scale down/up sequence with spinning border
		RNAnimated.sequence([
			// Scale down button slightly
			RNAnimated.timing(buttonScaleValue, {
				toValue: 0.95,
				duration: 150,
				useNativeDriver: true,
				easing: Easing.out(Easing.cubic),
			}),
			// Spin border with acceleration and deceleration
			RNAnimated.timing(borderSpinValue, {
				toValue: 1,
				duration: 1200,
				useNativeDriver: true,
				easing: Easing.inOut(Easing.cubic), // Accelerate and decelerate smoothly
			}),
			// Scale back up
			RNAnimated.timing(buttonScaleValue, {
				toValue: 1,
				duration: 150,
				useNativeDriver: true,
				easing: Easing.out(Easing.cubic),
			})
		]).start(() => {
			// Animation completed
			setIsSpinning(false);
			setShowSignupScreen(true);
		});
	};
	
	// Map 0-1 animation value to a full 720 degree rotation (two spins)
	const borderSpin = borderSpinValue.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '720deg']
	});
	
	// Handle back button press
	const handleBackPress = () => {
		setShowLoginScreen(false);
		setShowSignupScreen(false);
		setShowForgotPasswordScreen(false);
	};

	const handleBackPressForgotPassword = () => {
		setShowLoginScreen(true);
		setShowSignupScreen(false);
		setShowForgotPasswordScreen(false);
	};
	
	// Handle successful login
	const handleSuccessfulLogin = () => {
		onLogin();
	};
	
	// Handle successful signup - show confirmation screen instead of immediately registering
	const handleSuccessfulSignup = () => {
		setShowSignupScreen(false);
		setShowConfirmationScreen(true);
	};
	
	// Handle confirmation screen completion and move to brand search
	const handleConfirmationComplete = (choice: 'option1' | 'option2') => {
		console.log(`User selected option: ${choice}`);
		// Save the selected option and show brand search screen
		setSelectedOption(choice);
		setShowConfirmationScreen(false);
		setShowBrandSearchScreen(true);
	};
	
	// Handle brand search completion and show styles selection
	const handleBrandSearchComplete = (brands: string[]) => {
		console.log(`User selected brands: ${brands.join(', ')}`);
		// Save the selected brands and show styles selection screen
		setSelectedBrands(brands);
		setShowBrandSearchScreen(false);
		setShowStylesSelectionScreen(true);
	};
	
	// Handle styles selection completion and register the user
	const handleStylesSelectionComplete = (styles: string[]) => {
		console.log(`User selected styles: ${styles.join(', ')}`);
		// Pass style preference, selected brands, and favorite styles to onRegister
		onRegister(selectedOption, selectedBrands, styles);
	};
	
	// If showing login screen
	if (showLoginScreen) {
		return (
			<LoginScreen 
				onLogin={handleSuccessfulLogin} 
				onBack={handleBackPress} 
				onForgotPassword={handleForgotPasswordPress}
			/>
		);
	}
	
	// If showing forgot password screen
	if (showForgotPasswordScreen) {
		return (
			<ForgotPasswordScreen 
				onBack={handleBackPressForgotPassword}
			/>
		);
	}
	
	// If showing signup screen
	if (showSignupScreen) {
		return (
			<SignupScreen 
				onSignup={handleSuccessfulSignup} 
				onBack={handleBackPress} 
			/>
		);
	}
	
	// If showing confirmation screen
	if (showConfirmationScreen) {
		return (
			<ConfirmationScreen 
				onComplete={handleConfirmationComplete} 
				onBack={() => {
					setShowConfirmationScreen(false);
					setShowSignupScreen(true);
				}}
			/>
		);
	}
	
	// If showing brand search screen
	if (showBrandSearchScreen) {
		return (
			<BrandSearchScreen 
				onComplete={handleBrandSearchComplete}
				onBack={() => {
					setShowBrandSearchScreen(false);
					setShowConfirmationScreen(true);
				}}
			/>
		);
	}
	
	// If showing styles selection screen
	if (showStylesSelectionScreen) {
		return (
			<StylesSelectionScreen 
				onComplete={handleStylesSelectionComplete}
				onBack={() => {
					setShowStylesSelectionScreen(false);
					setShowBrandSearchScreen(true);
				}}
			/>
		);
	}

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
				{isReady && (
					<View style={styles.whiteBox}>
						<Animated.View 
							entering={FadeInDown.duration(500)}
							style={styles.logoContainer}
						>
							<Logo width={LOGO_SIZE} height={LOGO_SIZE} />
							<Text style={styles.logoText}>ПОЛКА</Text>
						</Animated.View>
						
						<Animated.View 
							entering={FadeInDown.duration(500).delay(50)}
							style={styles.shadowWrap}
						>
							{/* Container for the button - this stays still */}
							<View style={styles.registerButtonContainer}>
								{/* Spinning border gradient */}
								<RNAnimated.View
									style={{
										width: '100%',
										height: '100%',
										position: 'absolute',
										borderRadius: 41,
										transform: [{ rotate: borderSpin }],
									}}
								>
									<LinearGradient
										colors={['#DCD3DE', '#9535EA', '#E222F0']}
										start={{ x: 0.49, y: 0 }}
										end={{ x: 0.51, y: 1 }}
										locations={[0.55, 0.77, 1]}
										style={styles.registerButtonBorder}
									/>
								</RNAnimated.View>
								
								{/* Button itself - scales but doesn't spin */}
								<RNAnimated.View
									style={{
										width: '100%',
										height: '100%',
										padding: 3, // Match border thickness
										transform: [{ scale: buttonScaleValue }],
									}}
								>
									<Pressable
										onPress={handleRegisterPress}
										disabled={isSpinning}
										style={styles.pressableContainer}
									>
											<Text style={styles.registerButtonText}>Прикоснись к AI</Text>
									</Pressable>
								</RNAnimated.View>
							</View>
						</Animated.View>
						<Animated.View 
							entering={FadeInDown.duration(500).delay(100)}
							style={{justifyContent: 'flex-end'}}
						>
							<View style={styles.loginContainer}>
								<Text style={styles.loginText}>Есть аккаунт?</Text>
								<TouchableOpacity 
									style={styles.loginButton}
									onPress={handleLoginPress}
								>
									<Text style={styles.loginButtonText}>Войти</Text>
								</TouchableOpacity>
							</View>
						</Animated.View>
					</View>
				)}
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
		paddingTop: Platform.OS === 'android' ? 30 : 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	whiteBox: {
		backgroundColor: '#F2ECE7',
		borderRadius: 41,
		height: '95%',
		width: '88%',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 30,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	logoContainer: {
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	registerButtonContainer: {
		width: width*0.75, // Fixed width to ensure consistent size
		height: height*0.09, // Fixed height for the button
		borderRadius: 41,
		overflow: 'hidden',
		position: 'relative',
	},
	registerButtonBorder: {
		flex: 1,
		borderRadius: 41,
	},
	pressableContainer: {
		width: '100%',
		height: '100%',
		borderRadius: 38,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#DCD3DE',
	},
	registerButtonGradient: {
		flex: 1,
		borderRadius: 38, // Slightly smaller to create border effect
		alignItems: 'center',
		justifyContent: 'center',
		opacity: 0.8,
	},
	registerButtonText: {
		fontFamily: 'IgraSans',
		fontSize: 15,
		color: '#A000B0',
	},
	loginContainer: {
		alignItems: 'center',
	},
	loginText: {
		fontFamily: 'IgraSans',
		fontSize: 15,
		color: '#787878',
		marginBottom: 10,
	},
	loginButton: {
		backgroundColor: '#4A3120',
		borderRadius: 41,
		paddingVertical: 27,
		paddingHorizontal: 45,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	loginButtonText: {
		fontFamily: 'IgraSans',
		fontSize: 15,
		color: '#F2ECE7',
	},
	shadowWrap: {
		justifyContent: 'center',
	},
	logoText: {
		fontFamily: 'IgraSans',
		fontSize: 22,
		color: '#4A3120',
		marginTop: 15,
	},
});

export default WelcomeScreen;
    		
    		