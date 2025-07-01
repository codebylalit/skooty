import React from 'react';
import { Button, Text, View } from 'react-native';

export default function RoleSelectorScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 28, marginBottom: 40 }}>Select Your Role</Text>
      <Button title="User" onPress={() => navigation.replace('UserApp')} />
      <View style={{ height: 20 }} />
      <Button title="Driver" onPress={() => navigation.replace('DriverApp')} />
      <View style={{ height: 20 }} />
      <Button title="Admin" onPress={() => navigation.replace('AdminApp')} />
    </View>
  );
} 