import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';

export default function HomeScreen({ navigation }) {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to book a ride.');
        setLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      Alert.alert('Location fetched', `Lat: ${loc.coords.latitude}, Lon: ${loc.coords.longitude}`);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white justify-center px-8`}>
      <Text style={tw`text-2xl font-bold text-blue-600 mb-8 text-center`}>Book a Ride</Text>
      <TextInput
        placeholder="Pickup Location"
        value={pickup}
        onChangeText={setPickup}
        style={tw`border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base`}
        placeholderTextColor="#A0AEC0"
      />
      <TextInput
        placeholder="Drop-off Location"
        value={drop}
        onChangeText={setDrop}
        style={tw`border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base`}
        placeholderTextColor="#A0AEC0"
      />
      <TouchableOpacity
        style={tw`flex-row items-center justify-center bg-blue-600 py-3 rounded-xl mb-4 ${loading ? 'opacity-50' : ''}`}
        onPress={getLocation}
        disabled={loading}
      >
        <Ionicons name="locate" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={tw`text-white text-lg font-semibold`}>{loading ? 'Getting Location...' : 'Use My Location'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tw`bg-blue-500 py-3 rounded-xl mb-3`}
        onPress={() => navigation.navigate('Map', { pickup, drop, location })}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>See on Map</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={tw`bg-green-500 py-3 rounded-xl`}
        onPress={() => navigation.navigate('RideHistory')}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>View Ride History</Text>
      </TouchableOpacity>
    </View>
  );
} 