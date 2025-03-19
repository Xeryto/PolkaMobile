import React, { useState, useEffect } from 'react';
import { 
	View, 
	Text, 
	StyleSheet, 
	Pressable, 
	Dimensions,
	Platform,
	SafeAreaView,
	Animated as RNAnimated
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

	// Handle register button press
	const handleRegisterPress = () => {
		setShowSignupScreen(true);
	};
	
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
					<>
						<Animated.View 
							entering={FadeIn.duration(800)}
							style={styles.logoContainer}
						>
							<Logo width={LOGO_SIZE} height={LOGO_SIZE} />
							<Text style={styles.logoText}>Polka Mobile</Text>
						</Animated.View>
						
						<Animated.View 
							entering={FadeIn.duration(800).delay(200)}
							style={styles.contentContainer}
						>
							<Pressable 
								style={styles.registerButton}
								onPress={handleRegisterPress}
							>
								<Text style={styles.registerButtonText}>Become a part of AI</Text>
							</Pressable>
							
							<View style={styles.loginContainer}>
								<Text style={styles.loginText}>Already have an account?</Text>
								<Pressable 
									style={styles.loginButton}
									onPress={handleLoginPress}
								>
									<Text style={styles.loginButtonText}>Log In</Text>
								</Pressable>
							</View>
						</Animated.View>
					</>
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
	},
	logoContainer: {
		alignItems: 'center',
		marginTop: '15%',
	},
	logoText: {
		fontFamily: 'IgraSans',
		fontSize: 32,
		color: 'white',
		marginTop: 20,
	},
	contentContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: '10%',
		paddingHorizontal: 30,
	},
	registerButton: {
		backgroundColor: 'rgba(205, 166, 122, 0.3)',
		borderWidth: 2,
		borderColor: 'rgba(255, 255, 255, 0.5)',
		borderRadius: 30,
		paddingVertical: 16,
		paddingHorizontal: 40,
		width: '100%',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	registerButtonText: {
		fontFamily: 'IgraSans',
		fontSize: 20,
		color: 'white',
	},
	loginContainer: {
		marginTop: 60,
		alignItems: 'center',
	},
	loginText: {
		fontFamily: 'REM',
		fontSize: 16,
		color: 'white',
		marginBottom: 15,
	},
	loginButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		borderRadius: 30,
		paddingVertical: 14,
		paddingHorizontal: 60,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 3,
	},
	loginButtonText: {
		fontFamily: 'IgraSans',
		fontSize: 18,
		color: 'white',
	},
});

export default WelcomeScreen;
    		
    		