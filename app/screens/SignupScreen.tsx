import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';
import { auth } from '../firebaseConfig';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.replace('Home');
    } catch (e) {
      setError(e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white justify-center px-8`}>
      <Text style={tw`text-3xl font-bold text-blue-600 mb-8 text-center`}>Sign Up</Text>
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
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>{loading ? 'Signing up...' : 'Sign Up'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={tw`text-blue-600 text-center text-base`}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
} 