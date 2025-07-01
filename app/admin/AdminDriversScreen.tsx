import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { db } from '@/app/firebaseConfig';

export default function AdminDriversScreen() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      setError('');
      try {
        const querySnapshot = await getDocs(collection(db, 'drivers'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDrivers(data);
      } catch (e) {
        setError('Could not fetch drivers.');
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, [updating]);

  const handleVerify = async (driverId, value) => {
    setUpdating(driverId + value);
    try {
      await updateDoc(doc(db, 'drivers', driverId), { verified: value });
      Alert.alert('Success', value ? 'Driver approved.' : 'Driver rejected.');
    } catch (e) {
      Alert.alert('Error', 'Could not update verification status.');
    } finally {
      setUpdating('');
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
      <Text style={tw`text-2xl font-bold text-blue-600 mb-6 text-center`}>Drivers Management</Text>
      <FlatList
        data={drivers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={tw`mb-4 border border-gray-200 rounded-xl p-4 bg-gray-50`}> 
            <Text style={tw`text-base text-gray-700 mb-1`}>Email: {item.email}</Text>
            <Text style={tw`text-base mb-1`}>Status: <Text style={tw`${item.verified ? 'text-green-600' : 'text-yellow-600'}`}>{item.verified ? 'Verified' : 'Pending'}</Text></Text>
            {item.documentUrl && (
              <Image source={{ uri: item.documentUrl }} style={tw`w-44 h-28 my-2 rounded-lg self-center`} />
            )}
            <View style={tw`flex-row justify-between mt-2`}>
              <TouchableOpacity
                style={tw`bg-green-600 py-2 rounded-xl flex-1 mr-2`}
                onPress={() => handleVerify(item.id, true)}
                disabled={updating !== ''}
              >
                <Text style={tw`text-white text-center text-base font-semibold`}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`bg-red-600 py-2 rounded-xl flex-1 ml-2`}
                onPress={() => handleVerify(item.id, false)}
                disabled={updating !== ''}
              >
                <Text style={tw`text-white text-center text-base font-semibold`}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={tw`text-center text-gray-400`}>No drivers found.</Text>}
      />
    </View>
  );
} 