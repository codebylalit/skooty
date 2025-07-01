import { auth, db } from '@/app/firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import tw from 'tailwind-react-native-classnames';

export default function DriverRegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri, uid) => {
    setUploading(true);
    try {
      const storage = getStorage();
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `driverDocs/${uid}`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      return url;
    } finally {
      setUploading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    try {
      if (!image) {
        setError('Please upload a document image.');
        setLoading(false);
        return;
      }
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;
      const docUrl = await uploadImageAsync(image, uid);
      await setDoc(doc(db, 'drivers', uid), {
        email,
        documentUrl: docUrl,
        verified: false,
        createdAt: new Date(),
      });
      navigation.replace('DriverHome');
    } catch (e) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 bg-white justify-center px-8`}>
      <Text style={tw`text-3xl font-bold text-blue-600 mb-8 text-center`}>Driver Registration</Text>
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
      <TouchableOpacity
        style={tw`bg-blue-600 py-3 rounded-xl w-full mb-4 mt-2`}
        onPress={pickImage}
        disabled={uploading}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>{uploading ? 'Uploading...' : 'Pick Document Image'}</Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={tw`w-32 h-24 my-2 rounded-lg self-center`} />}
      {error ? <Text style={tw`text-red-500 mb-2 text-center`}>{error}</Text> : null}
      <TouchableOpacity
        style={tw`bg-green-600 py-3 rounded-xl w-full mb-4`}
        onPress={handleRegister}
        disabled={uploading || loading}
      >
        <Text style={tw`text-white text-center text-lg font-semibold`}>{loading ? 'Registering...' : 'Register'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('DriverLogin')}>
        <Text style={tw`text-blue-600 text-center text-base`}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
} 