import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { auth } from '../firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace('Home');
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Login</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ marginBottom: 10, borderWidth: 1, padding: 8 }} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: 10, borderWidth: 1, padding: 8 }} />
      {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}
      <Button title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} disabled={loading} />
      <Text style={{ marginTop: 20 }} onPress={() => navigation.navigate('Signup')}>Don't have an account? Sign up</Text>
    </View>
  );
} 