import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { View } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import AdminDashboardScreen from './admin/AdminDashboardScreen';
import AdminDriversScreen from './admin/AdminDriversScreen';
import AdminLoginScreen from './admin/AdminLoginScreen';
import AdminRidesScreen from './admin/AdminRidesScreen';
import AdminUsersScreen from './admin/AdminUsersScreen';

const Stack = createStackNavigator();

export default function AdminApp() {
  return (
    <View style={tw`flex-1`}>
      <Stack.Navigator initialRouteName="AdminLogin">
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminDrivers" component={AdminDriversScreen} />
        <Stack.Screen name="AdminRides" component={AdminRidesScreen} />
      </Stack.Navigator>
    </View>
  );
} 