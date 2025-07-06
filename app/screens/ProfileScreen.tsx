import { Ionicons } from '@expo/vector-icons';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { auth, db } from '../../constants/firebaseConfig';

interface ProfileScreenProps {
    navigation: any;
}

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    profilePhotoUrl?: string;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        email: '',
        phone: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            // Get user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setProfile({
                    name: userData.name || user.displayName || '',
                    email: user.email || '',
                    phone: userData.phone || '',
                    profilePhotoUrl: userData.profilePhotoUrl || user.photoURL,
                });
            } else {
                // If user document doesn't exist, create it with basic info
                const userData = {
                    name: user.displayName || '',
                    email: user.email || '',
                    phone: '',
                    profilePhotoUrl: user.photoURL,
                    createdAt: new Date(),
                };
                await setDoc(doc(db, 'users', user.uid), userData);
                setProfile(userData);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!profile.name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setSaving(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user logged in');

            // Update Firebase Auth profile
            await updateProfile(user, {
                displayName: profile.name,
                photoURL: profile.profilePhotoUrl,
            });

            // Prepare user data, excluding undefined values
            const userData: any = {
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                updatedAt: new Date(),
            };

            // Only include profilePhotoUrl if it's not undefined
            if (profile.profilePhotoUrl !== undefined) {
                userData.profilePhotoUrl = profile.profilePhotoUrl;
            }

            // Update Firestore document
            await setDoc(doc(db, 'users', user.uid), userData, { merge: true });

            setIsEditing(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
                <Text style={{ color: Colors.light.secondary, fontSize: 16, fontFamily: 'Inter' }}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 36, paddingBottom: 18, backgroundColor: Colors.light.surface, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.light.secondary, fontFamily: 'Inter' }}>Profile</Text>
                <View style={{ flex: 1 }} />
                {!isEditing ? (
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Ionicons name="create-outline" size={24} color={Colors.light.primary} />
                    </TouchableOpacity>
                ) : (
                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity onPress={() => setIsEditing(false)} style={{ marginRight: 12 }}>
                            <Ionicons name="close" size={24} color={Colors.light.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            <Ionicons name="checkmark" size={24} color={saving ? Colors.light.secondary : Colors.light.primary} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ScrollView style={{ flex: 1, padding: 16 }}>
                {/* Profile Photo Section */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.light.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                        {profile.profilePhotoUrl ? (
                            <Text style={{ fontSize: 40, color: Colors.light.primary }}>👤</Text>
                        ) : (
                            <Ionicons name="person" size={40} color={Colors.light.primary} />
                        )}
                    </View>
                    {isEditing && (
                        <TouchableOpacity style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: Colors.light.primary, borderRadius: 20 }}>
                            <Text style={{ color: 'white', fontSize: 14, fontFamily: 'Inter' }}>Change Photo</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Profile Fields */}
                <View style={{ backgroundColor: Colors.light.surface, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: Colors.light.secondary + '99', marginBottom: 8, fontFamily: 'Inter' }}>Name</Text>
                    {isEditing ? (
                        <TextInput
                            style={{ fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter', borderWidth: 1, borderColor: Colors.light.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.light.background }}
                            value={profile.name}
                            onChangeText={(text) => setProfile({ ...profile, name: text })}
                            placeholder="Enter your name"
                            placeholderTextColor={Colors.light.secondary + '99'}
                        />
                    ) : (
                        <Text style={{ fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter' }}>{profile.name || 'Not set'}</Text>
                    )}
                </View>

                <View style={{ backgroundColor: Colors.light.surface, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: Colors.light.secondary + '99', marginBottom: 8, fontFamily: 'Inter' }}>Email</Text>
                    <Text style={{ fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter' }}>{profile.email}</Text>
                </View>

                <View style={{ backgroundColor: Colors.light.surface, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, color: Colors.light.secondary + '99', marginBottom: 8, fontFamily: 'Inter' }}>Phone Number</Text>
                    {isEditing ? (
                        <TextInput
                            style={{ fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter', borderWidth: 1, borderColor: Colors.light.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: Colors.light.background }}
                            value={profile.phone}
                            onChangeText={(text) => setProfile({ ...profile, phone: text })}
                            placeholder="Enter your phone number"
                            placeholderTextColor={Colors.light.secondary + '99'}
                            keyboardType="phone-pad"
                        />
                    ) : (
                        <Text style={{ fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter' }}>{profile.phone || 'Not set'}</Text>
                    )}
                </View>

                {/* Account Actions */}
                <View style={{ backgroundColor: Colors.light.surface, borderRadius: 16, padding: 16, marginTop: 16 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.light.secondary, marginBottom: 16, fontFamily: 'Inter' }}>Account</Text>

                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.light.background }}>
                        <Ionicons name="lock-closed-outline" size={20} color={Colors.light.secondary} style={{ marginRight: 12 }} />
                        <Text style={{ fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter' }}>Change Password</Text>
                        <View style={{ flex: 1 }} />
                        <Ionicons name="chevron-forward" size={20} color={Colors.light.secondary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
                        <Ionicons name="notifications-outline" size={20} color={Colors.light.secondary} style={{ marginRight: 12 }} />
                        <Text style={{ fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter' }}>Notification Settings</Text>
                        <View style={{ flex: 1 }} />
                        <Ionicons name="chevron-forward" size={20} color={Colors.light.secondary} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
} 