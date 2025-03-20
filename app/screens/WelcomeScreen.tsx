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
	Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import Logo from '../assets/Logo.svg';
import * as authStorage from '../authStorage';
import LoginScreen from './LoginScreen';
import SignupScreen from './SignupScreen';

interface WelcomeScreenProps {
	onLogin: () => void;
	onRegister: () => void;
}

const { width, height } = Dimensions.get('window');
const LOGO_SIZE = Math.min(width, height) * 0.25; // 25% of the smallest dimension

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin, onRegister }) => {
	const [showLoginScreen, setShowLoginScreen] = useState(false);
	const [showSignupScreen, setShowSignupScreen] = useState(false);
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
	};
	
	// Handle successful login
	const handleSuccessfulLogin = () => {
		onLogin();
	};
	
	// Handle successful registration
	const handleSuccessfulSignup = () => {
		onRegister();
	};
	
	// If showing login screen
	if (showLoginScreen) {
		return (
			<LoginScreen 
				onLogin={handleSuccessfulLogin} 
				onBack={handleBackPress} 
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
							entering={FadeIn.duration(800)}
							style={styles.logoContainer}
						>
							<Logo width={LOGO_SIZE} height={LOGO_SIZE} />
						</Animated.View>
						
						<Animated.View 
							entering={FadeIn.duration(800).delay(200)}
							style={{justifyContent: 'center'}}
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
										colors={['#FC8CAF', '#9EA7FF', '#A3FFD0']}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
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
										<LinearGradient
											colors={['#E222F0', '#4747E4', '#E66D7B']}
											start={{ x: 0, y: 0 }}
											end={{ x: 1, y: 1 }}
											style={styles.registerButtonGradient}
										>
											<Text style={styles.registerButtonText}>Прикоснись к AI</Text>
										</LinearGradient>
									</Pressable>
								</RNAnimated.View>
							</View>
						</Animated.View>
						<Animated.View 
							entering={FadeIn.duration(800).delay(200)}
							style={{justifyContent: 'flex-end'}}
						>
							<View style={styles.loginContainer}>
								<Text style={styles.loginText}>Есть аккаунт?</Text>
								<Pressable 
									style={styles.loginButton}
									onPress={handleLoginPress}
								>
									<Text style={styles.loginButtonText}>Войти</Text>
								</Pressable>
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
	},
	logoContainer: {
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	registerButtonContainer: {
		width: 300, // Fixed width to ensure consistent size
		height: 80, // Fixed height for the button
		borderRadius: 41,
		overflow: 'hidden',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.35,
		shadowRadius: 8,
		elevation: 8,
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
	},
	registerButtonGradient: {
		flex: 1,
		borderRadius: 38, // Slightly smaller to create border effect
		alignItems: 'center',
		justifyContent: 'center',
	},
	registerButtonText: {
		fontFamily: 'IgraSans',
		fontSize: 15,
		color: 'white',
		textShadowColor: 'rgba(0, 0, 0, 0.25)',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 3,
	},
	loginContainer: {
		alignItems: 'center',
	},
	loginText: {
		fontFamily: 'IgraSans',
		fontSize: 15,
		color: 'rgba(0, 0, 0, 0.48)',
		marginBottom: 10,
	},
	loginButton: {
		backgroundColor: '#9A7859',
		borderRadius: 41,
		paddingVertical: 30,
		paddingHorizontal: 45,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 3,
	},
	loginButtonText: {
		fontFamily: 'IgraSans',
		fontSize: 15,
		color: '#E0D6CC',
	},
});

export default WelcomeScreen;
    		
    		