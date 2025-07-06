import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView, DrawerItem, DrawerItemList, DrawerNavigationProp } from '@react-navigation/drawer';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { auth, db } from '../../constants/firebaseConfig';
import ProfileScreen from './ProfileScreen';
import RidesHistoryScreen from './RidesHistoryScreen';

// const quickDestinations = [
//   { name: 'Maharana Pratap Airport', image: require('../assets/images/airport.png') },
//   { name: 'Udaipur City Railway Station', image: require('../assets/images/train.png') },
//   { name: 'Udaipur Bus Depot', image: require('../assets/images/bus.png') },
// ];

type HomeScreenProps = {
  navigation: DrawerNavigationProp<any, any>;
};

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  profilePhotoUrl?: string | null;
}

function CustomDrawerContent(props: DrawerContentComponentProps & { profile?: UserProfile }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile({
          name: userData.name || user.displayName || 'User',
          email: userData.email || user.email || '',
          phone: userData.phone || '',
          profilePhotoUrl: userData.profilePhotoUrl || user.photoURL || null,
        });
      } else {
        setUserProfile({
          name: user.displayName || 'User',
          email: user.email || '',
          phone: '',
          profilePhotoUrl: user.photoURL || null,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile({
        name: 'User',
        email: '',
        phone: '',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: Colors.light.surface, paddingTop: 32, flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, minHeight: '100%' }}>
        {/* User Profile Section */}
        <View style={{ alignItems: 'center', marginTop: 0, marginBottom: 16 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.light.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
            {userProfile?.profilePhotoUrl ? (
              <Text style={{ fontSize: 24, color: Colors.light.primary }}>👤</Text>
            ) : (
              <Ionicons name="person" size={24} color={Colors.light.primary} />
            )}
          </View>
          <Text style={{ fontWeight: '700', color: Colors.light.secondary, fontSize: 18, fontFamily: 'Inter', marginBottom: 2 }}>
            {loading ? 'Loading...' : userProfile?.name || 'User'}
          </Text>
          {userProfile?.email && (
            <Text style={{ color: Colors.light.secondary + '99', fontSize: 14, fontFamily: 'Inter' }}>
              {userProfile.email}
            </Text>
          )}
        </View>

        <View style={{ marginHorizontal: 8, marginBottom: 8 }}>
          <DrawerItemList {...props} />
        </View>
        <View style={{ flex: 1 }} /> {/* Spacer to push logout to bottom */}
        <View style={{ marginHorizontal: 8, marginTop: 12, marginBottom: 62 }}>
          <DrawerItem
            label="Logout"
            labelStyle={{ color: Colors.dark.text, fontWeight: 'bold', fontFamily: 'Inter', fontSize: 16 }}
            style={{ borderRadius: 12, backgroundColor: Colors.dark.background, marginTop: 8 }}
            onPress={async () => {
              await signOut(auth);
              props.navigation.navigate('Welcome');
            }}
          />
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const Drawer = createDrawerNavigator();

function HomeDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="HomeScreen"
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: Colors.light.primary,
        drawerInactiveTintColor: Colors.light.secondary + '99',
        drawerStyle: { backgroundColor: Colors.light.surface, borderTopRightRadius: 24, borderBottomRightRadius: 24 },
        drawerLabelStyle: { fontWeight: 'bold', fontSize: 16, fontFamily: 'Inter' },
      }}
    >
      <Drawer.Screen
        name="HomeScreen"
        component={HomeScreenContent}
        options={{
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          )
        }}
      />
      <Drawer.Screen
        name="RidesHistoryScreen"
        component={RidesHistoryScreen}
        options={{
          title: 'Rides History',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          )
        }}
      />
    </Drawer.Navigator>
  );
}

function HomeScreenContent({ navigation }: HomeScreenProps) {
  React.useEffect(() => {
    (async () => {
      const rideId = await AsyncStorage.getItem('skooty_active_ride_id');
      if (rideId) {
        // Check ride status in Firestore
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const { db } = await import('../../constants/firebaseConfig');
          const rideDocSnap = await getDoc(doc(db, 'rides', rideId));
          if (rideDocSnap.exists()) {
            const rideData = rideDocSnap.data();
            // Only redirect if status is 'booked', 'accepted', or 'in_progress'
            if (rideData.status && ['booked', 'accepted', 'in_progress'].includes(rideData.status)) {
              navigation.navigate('BookingScreen');
            }
          }
        } catch (e) {
          // If error, do not redirect
        }
      }
    })();
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      {/* Top Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 36, paddingBottom: 18, backgroundColor: Colors.light.surface, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: Colors.light.primary }}>
        <TouchableOpacity style={{ marginRight: 2, padding: 6, borderRadius: 10, backgroundColor: Colors.light.background }} onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={32} color={Colors.light.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: Colors.light.card, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 }}
          onPress={() => navigation.navigate('LocationPickerScreen')}
        >
          <Ionicons name="search" size={20} color={Colors.light.secondary + '99'} style={{ marginRight: 8 }} />
          <Text style={{ color: Colors.light.secondary + '99', fontSize: 16, fontFamily: 'Inter' }}>Where are you going?</Text>
        </TouchableOpacity>
      </View>

      {/* Minimal, clean bottom section */}
      <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 24, paddingTop: 36 }}>
        {/* Welcome message */}
        <Text style={{ fontSize: 22, fontWeight: '700', color: Colors.light.primary, marginBottom: 12, fontFamily: 'Inter' }}>
          Welcome to Skooty!
        </Text>
        <Text style={{ fontSize: 15, color: Colors.light.secondary + '99', marginBottom: 28, textAlign: 'center', fontFamily: 'Inter' }}>
          Your reliable ride, anytime, anywhere.
        </Text>

        {/* Book a Ride Card */}
        <TouchableOpacity
          style={{ width: '100%', backgroundColor: Colors.light.primary, borderRadius: 18, paddingVertical: 22, alignItems: 'center', marginBottom: 32, shadowColor: Colors.light.primary, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}
          onPress={() => navigation.navigate('LocationPickerScreen')}
        >
          <Ionicons name="car-outline" size={32} color={Colors.light.surface} style={{ marginBottom: 6 }} />
          <Text style={{ color: Colors.light.surface, fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter' }}>Book a Ride</Text>
        </TouchableOpacity>

        {/* Quick Destinations */}
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: Colors.light.surface, marginHorizontal: 4 }} onPress={() => navigation.navigate('LocationPickerScreen', { destination: 'Airport' })}>
            <Text style={{ fontSize: 22, marginBottom: 2 }}>✈️</Text>
            <Text style={{ color: Colors.light.secondary, fontSize: 13, fontFamily: 'Inter' }}>Airport</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: Colors.light.surface, marginHorizontal: 4 }} onPress={() => navigation.navigate('LocationPickerScreen', { destination: 'Railway Station' })}>
            <Text style={{ fontSize: 22, marginBottom: 2 }}>🚆</Text>
            <Text style={{ color: Colors.light.secondary, fontSize: 13, fontFamily: 'Inter' }}>Railway</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: Colors.light.surface, marginHorizontal: 4 }} onPress={() => navigation.navigate('LocationPickerScreen', { destination: 'Bus Depot' })}>
            <Text style={{ fontSize: 22, marginBottom: 2 }}>🚌</Text>
            <Text style={{ color: Colors.light.secondary, fontSize: 13, fontFamily: 'Inter' }}>Bus Depot</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Export the drawer-wrapped HomeScreen
export default HomeDrawer; 