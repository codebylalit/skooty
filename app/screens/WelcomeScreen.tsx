import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={tw`flex-1 bg-yellow-50 justify-center items-center px-8`}>
      {/* App Logo/Icon */}
      <View style={tw`mb-6`}>
        {/* <Image
          source={require('../assets/images/icon.png')} // Replace with your logo
          style={tw`w-24 h-24 rounded-full bg-white shadow`}
          resizeMode="contain"
        /> */}
      </View>
      {/* App Name */}
      <Text style={tw`text-4xl font-extrabold text-yellow-600 mb-2`}>Skooty</Text>
      {/* Tagline */}
      <Text style={tw`text-lg text-gray-700 mb-8 text-center`}>
        Fast, safe, and affordable rides in your city.
      </Text>
      {/* User Buttons */}
      <TouchableOpacity
        style={tw`w-full bg-yellow-500 py-3 rounded-xl mb-4 shadow`}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={tw`text-white text-center text-lg font-bold`}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tw`w-full border-2 border-yellow-500 py-3 rounded-xl mb-6`}
        onPress={() => navigation.navigate('Signup')}
      >
        <Text style={tw`text-yellow-600 text-center text-lg font-bold`}>Sign Up</Text>
      </TouchableOpacity>
      {/* Divider */}
      <Text style={tw`text-gray-400 mb-2`}>or</Text>
      {/* Driver/Admin Buttons */}
      <TouchableOpacity
        style={tw`w-full bg-blue-600 py-3 rounded-xl mb-3`}
        onPress={() => navigation.navigate('DriverLogin')}
      >
        <Text style={tw`text-white text-center text-lg font-bold`}>Login as Driver</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tw`w-full bg-gray-800 py-3 rounded-xl`}
        onPress={() => navigation.navigate('AdminLogin')}
      >
        <Text style={tw`text-white text-center text-lg font-bold`}>Login as Admin</Text>
      </TouchableOpacity>
    </View>
  );
} 