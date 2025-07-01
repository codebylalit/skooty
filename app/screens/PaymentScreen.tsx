import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';

export default function PaymentScreen({ navigation }) {
  return (
    <View style={tw`flex-1 justify-center items-center bg-white px-8`}>
      <Text style={tw`text-2xl font-bold text-blue-600 mb-8`}>Select Payment Method</Text>
      <TouchableOpacity
        style={tw`bg-green-600 py-3 rounded-xl w-full mb-4`}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>Pay with Cash</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tw`bg-blue-600 py-3 rounded-xl w-full`}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>Pay Online (Coming Soon)</Text>
      </TouchableOpacity>
    </View>
  );
} 