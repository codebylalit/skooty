import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { auth, db } from '../firebaseConfig';

function haversineDistance(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

export default function FareEstimateScreen({ navigation, route }) {
  const pickupCoords = route.params?.pickupCoords;
  const dropoffCoords = route.params?.dropoffCoords;
  const distance = haversineDistance(pickupCoords, dropoffCoords);
  const baseFare = 40; // base fare in currency units
  const perKm = 12; // per km rate
  const fare = Math.round(baseFare + distance * perKm);

  const handleConfirmBooking = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to book a ride.');
        return;
      }
      await addDoc(collection(db, 'rides'), {
        userId: user.uid,
        pickup: pickupCoords || null,
        dropoff: dropoffCoords || null,
        fare,
        distance,
        status: 'booked',
        createdAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Ride booked!');
      navigation.navigate('RideStatus');
    } catch (e) {
      Alert.alert('Error', 'Could not book ride.');
    }
  };

  return (
    <View style={tw`flex-1 bg-white justify-center items-center px-8`}>
      <Text style={tw`text-2xl font-bold text-blue-600 mb-4`}>Estimated Fare</Text>
      <Text style={tw`text-lg text-gray-700 mb-2`}>₹{fare}</Text>
      <Text style={tw`text-base text-gray-500 mb-8`}>Distance: {distance.toFixed(2)} km</Text>
      <TouchableOpacity
        style={tw`bg-blue-600 py-3 rounded-xl w-full mb-2`}
        onPress={handleConfirmBooking}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>Confirm Booking</Text>
      </TouchableOpacity>
    </View>
  );
} 