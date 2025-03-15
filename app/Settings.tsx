import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  ScrollView, 
  Pressable 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// Define a simpler navigation type that our custom navigation can satisfy
interface SimpleNavigation {
  navigate: (screen: string) => void;
  goBack: () => void;
}

interface SettingsProps {
  navigation: SimpleNavigation;
}

interface SettingItem {
  id: string;
  title: string;
  type: 'switch' | 'button' | 'section';
  value?: boolean;
  onPress?: () => void;
}

const Settings = ({ navigation }: SettingsProps) => {
  const [settings, setSettings] = useState<SettingItem[]>([
    { 
      id: 'notifications_section', 
      title: 'Notifications', 
      type: 'section' 
    },
    { 
      id: 'push_notifications', 
      title: 'Push Notifications', 
      type: 'switch', 
      value: true 
    },
    { 
      id: 'email_notifications', 
      title: 'Email Notifications', 
      type: 'switch', 
      value: false 
    },
    { 
      id: 'account_section', 
      title: 'Account', 
      type: 'section' 
    },
    { 
      id: 'edit_profile', 
      title: 'Edit Profile', 
      type: 'button', 
      onPress: () => console.log('Edit Profile') 
    },
    { 
      id: 'change_password', 
      title: 'Change Password', 
      type: 'button', 
      onPress: () => console.log('Change Password') 
    },
    { 
      id: 'payment_methods', 
      title: 'Payment Methods', 
      type: 'button', 
      onPress: () => console.log('Payment Methods') 
    },
    { 
      id: 'appearance_section', 
      title: 'Appearance', 
      type: 'section' 
    },
    { 
      id: 'dark_mode', 
      title: 'Dark Mode', 
      type: 'switch', 
      value: false 
    },
    { 
      id: 'language', 
      title: 'Language', 
      type: 'button', 
      onPress: () => console.log('Language') 
    },
    { 
      id: 'about_section', 
      title: 'About', 
      type: 'section' 
    },
    { 
      id: 'privacy_policy', 
      title: 'Privacy Policy', 
      type: 'button', 
      onPress: () => console.log('Privacy Policy') 
    },
    { 
      id: 'terms_of_service', 
      title: 'Terms of Service', 
      type: 'button', 
      onPress: () => console.log('Terms of Service') 
    },
    { 
      id: 'about_us', 
      title: 'About Us', 
      type: 'button', 
      onPress: () => console.log('About Us') 
    },
  ]);

  const toggleSwitch = (id: string) => {
    setSettings(prevSettings => 
      prevSettings.map(setting => 
        setting.id === id && setting.type === 'switch'
          ? { ...setting, value: !setting.value }
          : setting
      )
    );
  };

  const renderSettingItem = (item: SettingItem, index: number) => {
    switch (item.type) {
      case 'section':
        return (
          <Animated.View 
            key={item.id}
            entering={FadeInDown.duration(400).delay(100 + index * 50)}
            style={styles.sectionHeader}
          >
            <Text style={styles.sectionTitle}>{item.title}</Text>
          </Animated.View>
        );
      case 'switch':
        return (
          <Animated.View 
            key={item.id}
            entering={FadeInDown.duration(400).delay(100 + index * 50)}
            style={styles.settingItem}
          >
            <Text style={styles.settingTitle}>{item.title}</Text>
            <Switch
              trackColor={{ false: "#E2CCB2", true: "#CDA67A" }}
              thumbColor={item.value ? "#6A462F" : "#F2ECE7"}
              ios_backgroundColor="#E2CCB2"
              onValueChange={() => toggleSwitch(item.id)}
              value={item.value}
            />
          </Animated.View>
        );
      case 'button':
        return (
          <Animated.View 
            key={item.id}
            entering={FadeInDown.duration(400).delay(100 + index * 50)}
          >
            <Pressable 
              style={styles.settingButton}
              onPress={item.onPress}
            >
              <Text style={styles.settingTitle}>{item.title}</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </Pressable>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        entering={FadeIn.duration(500)}
        style={styles.roundedBox}
      >
        <LinearGradient
          colors={["rgba(205, 166, 122, 0.4)", "rgba(205, 166, 122, 0)"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0.3 }}
          style={styles.gradientBackground}
        />
        
        <Text style={styles.title}>Settings</Text>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.settingsContainer}
        >
          {settings.map((item, index) => renderSettingItem(item, index))}
          
          <Animated.View 
            entering={FadeInDown.duration(400).delay(800)}
            style={styles.logoutContainer}
          >
            <Pressable 
              style={styles.logoutButton}
              onPress={() => console.log('Logout')}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    borderRadius: 37,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  roundedBox: {
    width: '88%',
    height: '95%',
    borderRadius: 41,
    backgroundColor: 'rgba(205, 166, 122, 0)',
    position: 'relative',
    borderWidth: 3,
    borderColor: 'rgba(205, 166, 122, 0.4)',
    padding: 20,
  },
  title: {
    fontFamily: 'IgraSans',
    fontSize: 38,
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsContainer: {
    paddingBottom: 20,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'IgraSans',
    fontSize: 24,
    color: 'white',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2ECE7',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2ECE7',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingTitle: {
    fontFamily: 'REM',
    fontSize: 16,
    color: '#6A462F',
  },
  arrowIcon: {
    fontFamily: 'REM',
    fontSize: 18,
    color: '#CDA67A',
  },
  logoutContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 30,
    minWidth: 150,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF6B6B',
    fontFamily: 'IgraSans',
    fontSize: 18,
  },
});

export default Settings; 