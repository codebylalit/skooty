import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { auth } from '@/app/firebaseConfig';

const ADMIN_EMAIL = 'admin@skooty.com'; // Change to your admin email

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      if (email !== ADMIN_EMAIL) {
        setError('Access denied: Not an admin email.');
        setLoading(false);
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace('AdminDashboard');
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white justify-center px-8`}>
      <Text style={tw`text-3xl font-bold text-blue-600 mb-8 text-center`}>Admin Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={tw`border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base`}
        placeholderTextColor="#A0AEC0"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={tw`border border-gray-300 rounded-xl px-4 py-3 mb-2 text-base`}
        placeholderTextColor="#A0AEC0"
      />
      {error ? <Text style={tw`text-red-500 mb-2 text-center`}>{error}</Text> : null}
      <TouchableOpacity
        style={tw`bg-blue-600 py-3 rounded-xl mb-4 mt-2`}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
    </View>
  );
} 