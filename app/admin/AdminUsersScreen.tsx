import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { db } from '@/app/firebaseConfig';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(data);
      } catch (e) {
        setError('Could not fetch users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [deleting]);

  const handleDelete = async (userId) => {
    setDeleting(userId);
    try {
      await deleteDoc(doc(db, 'users', userId));
      Alert.alert('Success', 'User deleted from Firestore.');
    } catch (e) {
      Alert.alert('Error', 'Could not delete user.');
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
      <Text style={tw`text-2xl font-bold text-blue-600 mb-6 text-center`}>Users Management</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={tw`mb-4 border border-gray-200 rounded-xl p-4 bg-gray-50`}> 
            <Text style={tw`text-base text-gray-700 mb-1`}>Email: {item.email}</Text>
            <TouchableOpacity
              style={tw`bg-red-600 py-2 rounded-xl w-full mt-2`}
              onPress={() => handleDelete(item.id)}
              disabled={deleting !== ''}
            >
              <Text style={tw`text-white text-center text-base font-semibold`}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={tw`text-center text-gray-400`}>No users found.</Text>}
      />
    </View>
  );
} 