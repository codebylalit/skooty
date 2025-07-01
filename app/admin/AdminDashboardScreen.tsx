import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';

export default function AdminDashboardScreen({ navigation }) {
  return (
    <View style={tw`flex-1 bg-white justify-center items-center px-8`}>
      <Text style={tw`text-3xl font-bold text-blue-600 mb-8 text-center`}>Welcome, Admin!</Text>
      <TouchableOpacity
        style={tw`w-full bg-blue-600 py-3 rounded-xl mb-4`}
        onPress={() => navigation.navigate('AdminUsers')}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>Manage Users</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tw`w-full bg-green-600 py-3 rounded-xl mb-4`}
        onPress={() => navigation.navigate('AdminDrivers')}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>Manage Drivers</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tw`w-full bg-gray-800 py-3 rounded-xl`}
        onPress={() => navigation.navigate('AdminRides')}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>Manage Rides</Text>
      </TouchableOpacity>
    </View>
  );
} 