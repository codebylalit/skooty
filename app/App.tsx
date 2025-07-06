import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { View } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import AdminLoginScreen from './admin/AdminLoginScreen';
import BookingScreen from './screens/BookingScreen';
import HomeScreen from './screens/HomeScreen';
import LocationPickerScreen from './screens/LocationPickerScreen';
import ProfileScreen from './screens/ProfileScreen';
import RidesHistoryScreen from './screens/RidesHistoryScreen';
import WelcomeScreen from './screens/WelcomeScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <View style={tw`flex-1 bg-white`}>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="LocationPickerScreen" component={LocationPickerScreen} />
        <Stack.Screen name="BookingScreen" component={BookingScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="RidesHistoryScreen" component={RidesHistoryScreen} />
      </Stack.Navigator>
    </View>
  );
} 