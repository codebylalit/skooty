import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AdminApp from './AdminApp';
import App from './App';
import DriverApp from './DriverApp';
import RoleSelectorScreen from './RoleSelectorScreen';

const Stack = createStackNavigator();

export default function MainApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="RoleSelector" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RoleSelector" component={RoleSelectorScreen} />
        <Stack.Screen name="UserApp" component={App} />
        <Stack.Screen name="DriverApp" component={DriverApp} />
        <Stack.Screen name="AdminApp" component={AdminApp} />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 