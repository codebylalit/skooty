import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { View } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import FareEstimateScreen from './screens/FareEstimateScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import MapScreen from './screens/MapScreen';
import PaymentScreen from './screens/PaymentScreen';
import RideHistoryScreen from './screens/RideHistoryScreen';
import RideStatusScreen from './screens/RideStatusScreen';
import SignupScreen from './screens/SignupScreen';
import WelcomeScreen from './screens/WelcomeScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <View style={tw`flex-1 bg-white`}>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="FareEstimate" component={FareEstimateScreen} />
        <Stack.Screen name="RideStatus" component={RideStatusScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
      </Stack.Navigator>
    </View>
  );
} 