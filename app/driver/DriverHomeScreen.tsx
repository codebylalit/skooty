import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { auth, db } from '@/app/firebaseConfig';

export default function DriverHomeScreen({ navigation }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      setError('');
      try {
        const q = query(collection(db, 'rides'), where('status', '==', 'booked'), where('driverId', '==', null));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRides(data);
      } catch (e) {
        setError('Could not fetch rides.');
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, []);

  const handleAcceptRide = async (rideId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in as a driver.');
        return;
      }
      await updateDoc(doc(db, 'rides', rideId), {
        driverId: user.uid,
        status: 'Driver on the way',
      });
      Alert.alert('Success', 'Ride accepted!');
      navigation.navigate('DriverRideStatus', { rideId });
    } catch (e) {
      Alert.alert('Error', 'Could not accept ride.');
    }
  };

  if (loading) {
    return <View style={tw`flex-1 justify-center items-center bg-white`}><ActivityIndicator size="large" /></View>;
  }
  if (error) {
    return <View style={tw`flex-1 justify-center items-center bg-white`}><Text style={tw`text-red-500`}>{error}</Text></View>;
  }

  return (
    <View style={tw`flex-1 bg-white px-4 pt-8`}>
      <Text style={tw`text-2xl font-bold text-blue-600 mb-6 text-center`}>Available Rides</Text>
      <FlatList
        data={rides}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={tw`mb-4 border border-gray-200 rounded-xl p-4 bg-gray-50`}> 
            <Text style={tw`text-base text-gray-700 mb-1`}>Fare: ₹{item.fare}</Text>
            <Text style={tw`text-base text-gray-500 mb-1`}>Pickup: {item.pickup?.latitude?.toFixed(5)}, {item.pickup?.longitude?.toFixed(5)}</Text>
            <Text style={tw`text-base text-gray-500 mb-3`}>Drop-off: {item.dropoff?.latitude?.toFixed(5)}, {item.dropoff?.longitude?.toFixed(5)}</Text>
            <TouchableOpacity
              style={tw`bg-blue-600 py-3 rounded-xl w-full`}
              onPress={() => handleAcceptRide(item.id)}
            >
              <Text style={tw`text-white text-center text-lg font-semibold`}>Accept Ride</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={tw`text-center text-gray-400`}>No available rides.</Text>}
      />
    </View>
  );
} 