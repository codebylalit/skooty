import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../constants/firebaseConfig';
import App from './App';
import WelcomeScreen from './screens/WelcomeScreen';

const Stack = createStackNavigator();

export default function MainApp() {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading, null = not logged in

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user);
      setUser(user);
    });
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="UserApp" component={App} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
} 