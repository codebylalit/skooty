import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { db } from '@/app/firebaseConfig';

export default function AdminRidesScreen() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');

  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      setError('');
      try {
        const querySnapshot = await getDocs(collection(db, 'rides'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRides(data);
      } catch (e) {
        setError('Could not fetch rides.');
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, [deleting]);

  const handleDelete = async (rideId) => {
    setDeleting(rideId);
    try {
      await deleteDoc(doc(db, 'rides', rideId));
      Alert.alert('Success', 'Ride deleted.');
    } catch (e) {
      Alert.alert('Error', 'Could not delete ride.');
    } finally {
      setDeleting('');
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
      <Text style={tw`text-2xl font-bold text-blue-600 mb-6 text-center`}>Rides Management</Text>
      <FlatList
        data={rides}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={tw`mb-4 border border-gray-200 rounded-xl p-4 bg-gray-50`}> 
            <Text style={tw`text-base text-gray-700 mb-1`}>Fare: ₹{item.fare}</Text>
            <Text style={tw`text-base text-gray-500 mb-1`}>Status: {item.status}</Text>
            <Text style={tw`text-base text-gray-500 mb-1`}>Pickup: {item.pickup?.latitude?.toFixed(5)}, {item.pickup?.longitude?.toFixed(5)}</Text>
            <Text style={tw`text-base text-gray-500 mb-3`}>Drop-off: {item.dropoff?.latitude?.toFixed(5)}, {item.dropoff?.longitude?.toFixed(5)}</Text>
            <TouchableOpacity
              style={tw`bg-red-600 py-2 rounded-xl w-full mt-2`}
              onPress={() => handleDelete(item.id)}
              disabled={deleting !== ''}
            >
              <Text style={tw`text-white text-center text-base font-semibold`}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={tw`text-center text-gray-400`}>No rides found.</Text>}
      />
    </View>
  );
} 