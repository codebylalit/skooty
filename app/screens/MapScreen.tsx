import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import tw from 'tailwind-react-native-classnames';

export default function MapScreen({ route, navigation }) {
  const { location } = route.params || {};
  const initialRegion = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  const [pickup, setPickup] = useState({
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
  });
  const [dropoff, setDropoff] = useState({
    latitude: initialRegion.latitude + 0.002,
    longitude: initialRegion.longitude + 0.002,
  });
  const [mode, setMode] = useState('pickup'); // 'pickup' or 'dropoff'

  const handleMapPress = (e) => {
    const coord = e.nativeEvent.coordinate;
    if (mode === 'pickup') setPickup(coord);
    else setDropoff(coord);
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <MapView
        style={tw`flex-1`}
        initialRegion={initialRegion}
        onPress={handleMapPress}
      >
        <Marker
          coordinate={pickup}
          pinColor={mode === 'pickup' ? '#2563eb' : 'green'}
          draggable={mode === 'pickup'}
          onDragEnd={e => setPickup(e.nativeEvent.coordinate)}
          title="Pickup Location"
        />
        <Marker
          coordinate={dropoff}
          pinColor={mode === 'dropoff' ? '#2563eb' : 'red'}
          draggable={mode === 'dropoff'}
          onDragEnd={e => setDropoff(e.nativeEvent.coordinate)}
          title="Drop-off Location"
        />
      </MapView>
      <View style={tw`p-4 bg-white border-t border-gray-200`}> 
        <View style={tw`flex-row justify-center mb-2`}> 
          <TouchableOpacity
            style={tw`px-4 py-2 rounded-lg mr-2 ${mode === 'pickup' ? 'bg-blue-600' : 'bg-gray-200'}`}
            onPress={() => setMode('pickup')}
          >
            <Text style={tw`${mode === 'pickup' ? 'text-white' : 'text-gray-700'} font-semibold`}>Set Pickup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`px-4 py-2 rounded-lg ${mode === 'dropoff' ? 'bg-blue-600' : 'bg-gray-200'}`}
            onPress={() => setMode('dropoff')}
          >
            <Text style={tw`${mode === 'dropoff' ? 'text-white' : 'text-gray-700'} font-semibold`}>Set Drop-off</Text>
          </TouchableOpacity>
        </View>
        <Text style={tw`text-center text-gray-700 mb-1`}>Pickup: {pickup.latitude.toFixed(5)}, {pickup.longitude.toFixed(5)}</Text>
        <Text style={tw`text-center text-gray-700 mb-3`}>Drop-off: {dropoff.latitude.toFixed(5)}, {dropoff.longitude.toFixed(5)}</Text>
        <TouchableOpacity
          style={tw`bg-blue-600 py-3 rounded-xl`}
          onPress={() => navigation.navigate('FareEstimate', { pickupCoords: pickup, dropoffCoords: dropoff })}
        >
          <Text style={tw`text-white text-center text-lg font-semibold`}>Estimate Fare</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 