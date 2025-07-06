import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Dimensions, Image, Linking, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { AnimatedRegion, Marker, Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../constants/Colors';
import { GOOGLE_MAPS_API_KEY } from '../../constants/Keys';
import { auth, db } from '../../constants/firebaseConfig';

const BIKE_RATE_PER_KM = 4; // Example: ₹8/km
const AUTO_RATE_PER_KM = 6; // Example: ₹12/km

type LatLng = { latitude: number; longitude: number };
type BookingScreenProps = {
  route: { params: { currentLocation: LatLng; destination: string; destinationCoords: LatLng } };
  navigation: any;
};
type Distance = { text: string; value: number } | null;
type Duration = { text: string; value: number } | null;

// Add this function to find available drivers by vehicleType
async function findAvailableDriver(vehicleType: 'auto' | 'bike') {
  // Query Firestore for drivers with matching vehicleType and available status
  // (You may want to add an 'available' field to driver profiles for production)
  const { getDocs, collection, query, where } = await import('firebase/firestore');
  const driversRef = collection(db, 'drivers');
  const q = query(driversRef, where('vehicleType', '==', vehicleType));
  const snapshot = await getDocs(q);
  // Filter further by online/available status if needed
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export default function BookingScreen({ route, navigation }: BookingScreenProps) {
  const { currentLocation, destination, destinationCoords } = route.params || {};
  const defaultLatLng = { latitude: 12.9716, longitude: 77.5946 }; // Bangalore as fallback
  const [pickupCoords, setPickupCoords] = useState<LatLng>(normalizeLatLng(currentLocation) || defaultLatLng);
  const [dropCoords, setDropCoords] = useState<LatLng>(normalizeLatLng(destinationCoords) || defaultLatLng);
  const [polylineCoords, setPolylineCoords] = useState<LatLng[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [distance, setDistance] = useState<Distance>(null);
  const [duration, setDuration] = useState<Duration>(null);
  const [selected, setSelected] = useState<'bike' | 'auto'>('bike');
  const [routeError, setRouteError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');
  const mapRef = useRef<MapView>(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<'select' | 'payment' | 'searching' | 'driver'>('select');
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'qr' | null>(null);
  const [assignedDriver, setAssignedDriver] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [rideId, setRideId] = useState<string | null>(null);
  const typedAuth: ReturnType<typeof getAuth> = auth;
  const [_, forceUpdate] = useState(0);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  // Add new state for ride status and payment
  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const [paymentCollected, setPaymentCollected] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);
  // Add animated driver marker state
  const [driverMarker, setDriverMarker] = useState<any>(null);
  // Add state for notifications
  const [showArrivalBanner, setShowArrivalBanner] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [dropoffAddress, setDropoffAddress] = useState<string>('');
  const [activeRide, setActiveRide] = useState<any>(null);


  const isValidLatLng = (coords: LatLng | null | undefined) =>
    coords &&
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    !isNaN(coords.latitude) &&
    !isNaN(coords.longitude);

  function normalizeLatLng(coords: any): LatLng | null {
    if (!coords) return null;
    if ('latitude' in coords && 'longitude' in coords) {
      return coords;
    }
    if ('lat' in coords && 'lng' in coords) {
      return { latitude: coords.lat, longitude: coords.lng };
    }
    return null;
  }

  // Fetch human-readable addresses when pickup/drop coordinates change
  useEffect(() => {
    async function fetchAddresses() {
      if (pickupCoords && pickupCoords.latitude && pickupCoords.longitude) {
        try {
          const results = await Location.reverseGeocodeAsync(pickupCoords);
          if (results && results.length > 0) {
            const { name, street, city, district, region } = results[0];
            setPickupAddress([name, street, city || district || region].filter(Boolean).join(', '));
          } else {
            setPickupAddress(`${pickupCoords.latitude.toFixed(5)}, ${pickupCoords.longitude.toFixed(5)}`);
          }
        } catch {
          setPickupAddress(`${pickupCoords.latitude.toFixed(5)}, ${pickupCoords.longitude.toFixed(5)}`);
        }
      }
      if (dropCoords && dropCoords.latitude && dropCoords.longitude) {
        try {
          const results = await Location.reverseGeocodeAsync(dropCoords);
          if (results && results.length > 0) {
            const { name, street, city, district, region } = results[0];
            setDropoffAddress([name, street, city || district || region].filter(Boolean).join(', '));
          } else {
            setDropoffAddress(`${dropCoords.latitude.toFixed(5)}, ${dropCoords.longitude.toFixed(5)}`);
          }
        } catch {
          setDropoffAddress(`${dropCoords.latitude.toFixed(5)}, ${dropCoords.longitude.toFixed(5)}`);
        }
      }
    }
    fetchAddresses();
  }, [pickupCoords, dropCoords]);
  useEffect(() => {
    console.log('Pickup:', pickupCoords, 'Destination:', dropCoords);
    if (isValidLatLng(pickupCoords) && isValidLatLng(dropCoords)) {
      fetchRoute();
    } else {
      setRouteError('Invalid pickup or destination coordinates.');
    }
    // eslint-disable-next-line
  }, [pickupCoords, dropCoords]);

  // Zoom to fit route and markers when polylineCoords change
  useEffect(() => {
    if (mapRef.current && polylineCoords.length > 1) {
      mapRef.current.fitToCoordinates(polylineCoords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    } else if (mapRef.current && isValidLatLng(pickupCoords) && isValidLatLng(dropCoords)) {
      mapRef.current.fitToCoordinates([
        pickupCoords as LatLng,
        dropCoords as LatLng,
      ], {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [polylineCoords]);

  // Add effect to update route polyline based on ride status
  useEffect(() => {
    async function updateRoutePolyline() {
      if (!rideStatus) return;
      let origin, destination;
      if (rideStatus === 'Driver on the way' && driverLocation && pickupCoords) {
        origin = driverLocation;
        destination = pickupCoords;
      } else if (rideStatus === 'Ride in progress' && pickupCoords && dropCoords) {
        origin = pickupCoords;
        destination = dropCoords;
      } else {
        setPolylineCoords([]);
        return;
      }
      try {
        const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
          },
          body: JSON.stringify({
            origin: { location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } } },
            destination: { location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } } },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_UNAWARE',
          }),
        });
        const data = await response.json();
        if (data.routes && data.routes.length) {
          const encodedPolyline = data.routes[0].polyline.encodedPolyline;
          const points = decodePolyline(encodedPolyline);
          setPolylineCoords(points);
        } else {
          setPolylineCoords([]);
        }
      } catch (e) {
        setPolylineCoords([]);
      }
    }
    updateRoutePolyline();
    // eslint-disable-next-line
  }, [rideStatus, driverLocation, pickupCoords, dropCoords]);

  const fetchRoute = async () => {
    setLoadingRoute(true);
    setRouteError(null);
    try {
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: pickupCoords.latitude, longitude: pickupCoords.longitude } } },
          destination: { location: { latLng: { latitude: dropCoords.latitude, longitude: dropCoords.longitude } } },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_UNAWARE',
        }),
      });
      const data = await response.json();
      console.log('Routes API response:', JSON.stringify(data));
      if (data.routes && data.routes.length) {
        // Polyline decoding
        const encodedPolyline = data.routes[0].polyline.encodedPolyline;
        const points = decodePolyline(encodedPolyline);
        setPolylineCoords(points);
        setDistance({
          text: (data.routes[0].distanceMeters / 1000).toFixed(2) + ' km',
          value: data.routes[0].distanceMeters,
        });
        setDuration({
          text: Math.round(data.routes[0].duration.split('s')[0] / 60) + ' mins',
          value: parseInt(data.routes[0].duration.split('s')[0]),
        });
      } else {
        setPolylineCoords([]);
        setDistance(null);
        setDuration(null);
        setRouteError('No route found between selected locations.');
      }
    } catch (e) {
      setPolylineCoords([]);
      setDistance(null);
      setDuration(null);
      setRouteError('Failed to fetch route. Please try again.');
    } finally {
      setLoadingRoute(false);
    }
  };

  // Polyline decoder (Google encoded polyline algorithm)
  function decodePolyline(encoded: string): LatLng[] {
    let points: LatLng[] = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return points;
  }

  // Calculate fare based on selected option and distance
  const getFare = () => {
    if (!distance) return '--';
    const km = distance.value / 1000;
    if (selected === 'bike') return Math.round(km * BIKE_RATE_PER_KM);
    if (selected === 'auto') return Math.round(km * AUTO_RATE_PER_KM);
    return '--';
  };

  // Book ride handler (step 1 -> step 2)
  const handleBookRide = () => {
    console.log('[DEBUG] Book button pressed');
    setBookingStep('payment');
  };

  // Cancel ride handler with debug logs
  const handleCancelRide = async () => {
    if (rideId) {
      try {
        console.log('[DEBUG] Attempting to cancel ride:', rideId);
        await updateDoc(doc(db, 'rides', rideId), { status: 'cancelled' });
        const docSnap = await getDoc(doc(db, 'rides', rideId));
        console.log('[DEBUG] Ride after cancel:', docSnap.data());
        // Only reset UI state if Firestore update succeeded
        setBookingStep('select');
        setAssignedDriver(null);
        setRideId(null);
        setSelectedPayment(null);
        setBookingError(null);
        setSearching(false);
        setRideStatus(null);
        setPaymentCollected(false);
        setPaymentMethod(null);
        setActiveRide(null);
      } catch (err) {
        console.error('[DEBUG] Error cancelling ride:', err);
        setBookingError('Failed to cancel ride. Please try again.');
        // Do NOT reset UI state here
        return;
      }
    }
  };

  // Real-time driver assignment and status listener
  useEffect(() => {
    if (rideId) {
      const unsub = onSnapshot(doc(db, 'rides', rideId), async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Always update ride status and payment info
          setRideStatus(data.status || null);
          setPaymentCollected(!!data.paymentCollected);
          setPaymentMethod(data.paymentMethod || null);

          if ((data.status || '').toLowerCase() === 'cancelled') {
            setBookingError('Ride cancelled.');
            setBookingStep('select');
            setSearching(false);
            return;
          }
          if (data.driverId) {
            try {
              const driverSnap = await (await import('firebase/firestore')).getDoc(doc(db, 'drivers', data.driverId));
              if (driverSnap.exists()) {
                const driverData = { ...driverSnap.data(), id: data.driverId };
                setAssignedDriver(driverData);
                setBookingStep('driver');
                setSearching(false);
              }
            } catch (err) {
              // Handle error
            }
          }
        }
      });
      return () => unsub();
    }
  }, [rideId]);

  // Listen for driver's real-time location when assignedDriver is set
  useEffect(() => {
    let unsub: any;
    if (assignedDriver && assignedDriver.id) {
      unsub = onSnapshot(doc(db, 'drivers', assignedDriver.id), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.location && typeof data.location.latitude === 'number' && typeof data.location.longitude === 'number') {
            setDriverLocation({ latitude: data.location.latitude, longitude: data.location.longitude });
          }
        }
      });
    }
    return () => unsub && unsub();
  }, [assignedDriver]);

  // Update driver marker position with animation
  useEffect(() => {
    if (driverLocation) {
      if (!driverMarker) {
        setDriverMarker(new AnimatedRegion({
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        }));
      } else {
        driverMarker.timing({
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          duration: 500,
          useNativeDriver: false,
        }).start();
      }
    }
    // eslint-disable-next-line
  }, [driverLocation]);

  // Show arrival notification when status changes to 'Arrived at pickup'
  useEffect(() => {
    if (rideStatus === 'Arrived at pickup') {
      setShowArrivalBanner(true);
      setTimeout(() => setShowArrivalBanner(false), 4000);
    }
  }, [rideStatus]);

  // Show payment confirmation when ride is completed and payment is collected
  useEffect(() => {
    if (rideStatus === 'Completed' && paymentCollected) {
      setShowPaymentModal(true);
    }
  }, [rideStatus, paymentCollected]);

  // Auto-navigate to home when ride is completed or cancelled
  useEffect(() => {
    if (rideStatus === 'Completed' || rideStatus === 'cancelled') {
      // Small delay to allow user to see the final status
      const timer = setTimeout(() => {
        navigation.navigate('Home');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [rideStatus, navigation]);

  // On mount, check for any active ride for the current user
  useEffect(() => {
    const user = typedAuth.currentUser;
    if (!user) return;
    // Listen for any ride for this user that is not completed or cancelled
    const q = query(
      collection(db, 'rides'),
      where('userId', '==', user.uid),
      // Use 'in' for status if possible, otherwise filter in JS
      // Firestore does not support case-insensitive queries, so filter in JS
    );
    const unsub = onSnapshot(q, (snapshot) => {
      console.log('[DEBUG] All rides for user:', snapshot.docs.map(d => ({ id: d.id, status: d.data().status })));
      const ACTIVE_STATUSES = ['booked', 'driver on the way', 'ride in progress'];
      const activeRides = snapshot.docs.filter(docSnap => {
        const status = (docSnap.data().status || '').toLowerCase();
        return ACTIVE_STATUSES.includes(status);
      });
      console.log('[DEBUG] Active rides for user:', activeRides.map(d => ({ id: d.id, status: d.data().status })));
      if (activeRides.length > 0) {
        const rideDoc = activeRides[0];
        console.log('[DEBUG] Active ride detected:', rideDoc.id, rideDoc.data());
        setActiveRide({ id: rideDoc.id, ...rideDoc.data() });
        setRideId(rideDoc.id);
        setBookingStep('driver');
      } else {
        console.log('[DEBUG] No active ride found.');
        setActiveRide(null);
        setRideId(null);
        setBookingStep('select');
      }
    }, (error) => {
      console.error('[DEBUG] Firestore onSnapshot error:', error);
    });
    return () => unsub();
  }, []);

  // Handle payment selection (step 2 -> step 3)
  const handleSelectPayment = async (method: 'cash' | 'qr') => {
    // Map 'qr' to 'online' for compatibility
    const paymentType = method === 'qr' ? 'online' : method;
    setSelectedPayment(method);
    setBooking(true);
    setBookingError(null);
    try {
      const user = typedAuth.currentUser;
      if (!user) throw new Error('You must be logged in.');
      if (!pickupCoords || !dropCoords || !distance || !duration) throw new Error('Invalid route.');
      // Create ride with all required fields
      const rideDoc = await addDoc(collection(db, 'rides'), {
        userId: user.uid,
        pickup: pickupCoords,
        dropoff: dropCoords,
        vehicleType: selected,
        status: 'booked',
        driverId: null,
        fare: getFare(),
        distance: distance.value,
        duration: duration.value,
        paymentMethod: paymentType,
        paymentCollected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        customerName: user.displayName || '',
        customerPhone: user.phoneNumber || '',
      });
      setRideId(rideDoc.id);
      setBookingStep('searching');
      setSearching(true);
      // No polling or driver assignment here!
    } catch (e) {
      setBookingError((e as Error).message || 'Booking failed');
      setBookingStep('select');
    } finally {
      setBooking(false);
    }
  };

  // Add debug log in render
  console.log('Render: bookingStep', bookingStep, 'assignedDriver', assignedDriver);

  // In the modal close handler, navigate to Home after closing
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    navigation.navigate('Home');
  };

  // Handle back navigation with confirmation during active rides
  const handleBackNavigation = () => {
    if (rideStatus && rideStatus !== 'Completed') {
      Alert.alert('Hold on!', 'You cannot leave this screen during an active ride.', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        {
          text: 'Leave',
          onPress: () => BackHandler.exitApp(),
        },
      ]);
    } else {
      navigation.navigate('Home');
    }
  };

  // Back button handler to prevent leaving during active rides
  useEffect(() => {
    const backAction = () => {
      if (rideStatus && rideStatus !== 'Completed') {
        Alert.alert('Hold on!', 'You cannot leave this screen during an active ride.', [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {
            text: 'Leave',
            onPress: () => BackHandler.exitApp(),
          },
        ]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [rideStatus]);

  // Navigation focus listener to prevent navigation during active rides
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (rideStatus && rideStatus !== 'Completed') {
        // Prevent default action
        e.preventDefault();

        Alert.alert('Hold on!', 'You cannot leave this screen during an active ride.', [
          {
            text: 'Cancel',
            onPress: () => null,
            style: 'cancel',
          },
          {
            text: 'Leave',
            onPress: () => {
              // Force navigation after confirmation
              navigation.dispatch(e.data.action);
            },
          },
        ]);
      }
    });

    return unsubscribe;
  }, [navigation, rideStatus]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      {/* Add a back arrow only for 'select' or 'payment' steps and when no active ride */}
      {(bookingStep === 'select' || bookingStep === 'payment') && (!rideStatus || rideStatus === 'Completed') && (
        <View style={{ position: 'absolute', top: 36, left: 18, zIndex: 30 }}>
          <TouchableOpacity onPress={handleBackNavigation} style={{ backgroundColor: Colors.light.card, borderRadius: 20, padding: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }}>
            <Icon name="arrow-left" size={24} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>
      )}
      {/* Map Type Toggle Button */}
      <View style={{ position: 'absolute', zIndex: 10, top: 24, right: 24 }}>
        <TouchableOpacity
          style={{ backgroundColor: Colors.light.primary, paddingHorizontal: 6, paddingVertical: 6, borderRadius: 50, shadowColor: Colors.light.primary }}
          onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
        >
          <Text style={{ color: Colors.light.surface, fontSize: 8, fontWeight: 'bold', fontFamily: 'Inter' }}>
            {mapType === 'standard' ? 'Satellite View' : 'Standard View'}
          </Text>
        </TouchableOpacity>
      </View>
      {/* Add a header above the map showing the current status with icon and color */}
      {/* <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 28, backgroundColor: Colors.light.surface }}>
        <TouchableOpacity 
          style={{ padding: 4, borderRadius: 12, backgroundColor: Colors.light.background }}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: Colors.light.secondary, fontFamily: 'Inter' }}>
            Ride
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
            <Icon 
              name={rideStatus === 'Driver on the way' ? 'car' : rideStatus === 'Ride in progress' ? 'map-marker-path' : rideStatus === 'Completed' ? 'check-circle' : 'car'} 
              size={16} 
              color={rideStatus === 'Driver on the way' ? Colors.light.primary : rideStatus === 'Ride in progress' ? '#FF9500' : rideStatus === 'Completed' ? '#34C759' : Colors.light.primary} 
            />
            <Text style={{ fontSize: 14, color: rideStatus === 'Driver on the way' ? Colors.light.primary : rideStatus === 'Ride in progress' ? '#FF9500' : rideStatus === 'Completed' ? '#34C759' : Colors.light.primary, marginLeft: 6, fontWeight: '600', fontFamily: 'Inter' }}>
              {rideStatus}
            </Text>
          </View>
        </View>
      </View> */}
      {/* Map */}
      <View style={{ height: '50%', width: '100%' }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1, width: Dimensions.get('window').width }}
          initialRegion={{
            latitude: pickupCoords.latitude,
            longitude: pickupCoords.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          mapType={mapType}
        >
          {pickupCoords && typeof pickupCoords.latitude === 'number' && typeof pickupCoords.longitude === 'number' && (
            <Marker coordinate={pickupCoords} title="Pickup" pinColor="green" />
          )}
          {dropCoords && typeof dropCoords.latitude === 'number' && typeof dropCoords.longitude === 'number' && (
            <Marker coordinate={dropCoords} title="Drop-off" pinColor="red" />
          )}
          {polylineCoords.length > 0 && (
            <Polyline coordinates={polylineCoords} strokeWidth={4} strokeColor={Colors.light.primary} />
          )}
          {driverLocation && driverMarker && (
            <Marker.Animated
              coordinate={driverMarker}
              title="Driver"
              anchor={{ x: 0.5, y: 0.5 }}
              flat
            >
              <View style={{ backgroundColor: Colors.light.primary, borderRadius: 20, padding: 8, borderWidth: 2, borderColor: '#fff' }}>
                <Icon name="car" size={20} color={Colors.light.surface} />
              </View>
            </Marker.Animated>
          )}
        </MapView>
        {loadingRoute && <ActivityIndicator style={{ position: 'absolute', top: '50%', left: '50%' }} />}
        {routeError && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', marginTop: 16 }}>
            <Text style={{ color: '#e53935', backgroundColor: Colors.light.surface, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, fontFamily: 'Inter' }}>{routeError}</Text>
          </View>
        )}
      </View>
      {/* Fare Options */}
      <View style={{ flex: 1, backgroundColor: Colors.light.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, shadowColor: Colors.light.primary, shadowOpacity: 0.10, shadowRadius: 12, elevation: 2 }}>
        {bookingStep === 'payment' ? (
          booking ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Text style={{ marginTop: 16, fontSize: 18, color: Colors.light.secondary, fontFamily: 'Inter' }}>
                Booking your ride...
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: Colors.light.secondary, marginBottom: 16, fontFamily: 'Inter' }}>
                Select Payment Method
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.light.primary,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                  marginBottom: 12,
                  width: 200,
                }}
                onPress={() => handleSelectPayment('cash')}
              >
                <Text style={{ color: Colors.light.surface, fontWeight: 'bold', fontSize: 16, fontFamily: 'Inter' }}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.light.primary,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                  width: 200,
                }}
                onPress={() => handleSelectPayment('qr')}
              >
                <Text style={{ color: Colors.light.surface, fontWeight: 'bold', fontSize: 16, fontFamily: 'Inter' }}>QR Code</Text>
              </TouchableOpacity>
              {bookingError && <Text style={{ color: '#e53935', textAlign: 'center', marginTop: 4, fontFamily: 'Inter' }}>{bookingError}</Text>}
            </View>
          )
        ) : bookingStep === 'searching' ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={{ marginTop: 16, fontSize: 18, color: Colors.light.secondary, fontFamily: 'Inter' }}>
              Searching for a driver...
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 24,
                backgroundColor: '#e53935',
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
                width: 150,
              }}
              onPress={handleCancelRide}
            >
              <Text style={{ color: Colors.light.surface, fontWeight: 'bold', fontSize: 16, fontFamily: 'Inter' }}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {distance && duration && !routeError ? (
              <Text style={{ textAlign: 'center', color: Colors.light.secondary, marginBottom: 8, fontFamily: 'Inter' }}>{distance.text} • {duration.text}</Text>
            ) : routeError ? (
              <Text style={{ textAlign: 'center', color: '#e53935', marginBottom: 8, fontFamily: 'Inter' }}>{routeError}</Text>
            ) : null}
            <ScrollView showsVerticalScrollIndicator={false}>
              {[{
                id: 'bike',
                label: 'Bike',
                desc: 'Quick Bike rides',
                persons: 1,
                icon: <Icon name="motorbike" size={28} color={Colors.light.secondary} style={{ marginRight: 10 }} />
              }, {
                id: 'auto',
                label: 'Auto',
                desc: 'Auto rickshaw',
                persons: 3,
                icon: <Icon name="rickshaw" size={28} color={Colors.light.secondary} style={{ marginRight: 10 }} />
              }].map(fare => {
                // Calculate fares
                const km = distance ? distance.value / 1000 : 0;
                const baseFare = fare.id === 'bike' ? Math.round(km * BIKE_RATE_PER_KM) : Math.round(km * AUTO_RATE_PER_KM * 3);
                // Time calculations
                let mins = 0;
                let dropTime = '--';
                let approxDrop = '';
                if (duration) {
                  mins = Math.round(duration.value / 60);
                  const now = new Date();
                  const drop = new Date(now.getTime() + duration.value * 1000);
                  dropTime = drop.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  approxDrop = `Drop ${dropTime}`;
                }
                return (
                  <TouchableOpacity
                    key={fare.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: selected === fare.id ? Colors.light.card : Colors.light.card,
                      borderRadius: 18,
                      borderWidth: selected === fare.id ? 2 : 1,
                      borderColor: selected === fare.id ? Colors.light.primary : Colors.light.background,
                      padding: 18,
                      marginBottom: 18,
                      shadowColor: Colors.light.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                    }}
                    onPress={() => setSelected(fare.id as 'bike' | 'auto')}
                    disabled={!!routeError}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {fare.icon}
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 16, color: Colors.light.secondary, marginRight: 6, fontFamily: 'Inter' }}>{fare.label}</Text>
                          <Icon name="account" size={16} color={Colors.light.secondary} style={{ marginRight: 2 }} />
                          <Text style={{ fontSize: 14, color: Colors.light.secondary, fontFamily: 'Inter' }}>{fare.persons}</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: Colors.light.secondary + '99', marginBottom: 2, fontFamily: 'Inter' }}>{fare.desc}</Text>
                        <Text style={{ fontSize: 13, color: Colors.light.secondary + '99', fontFamily: 'Inter' }}>{mins} mins • {approxDrop}</Text>
                      </View>
                    </View>
                    <Text style={{ fontWeight: 'bold', fontSize: 20, color: Colors.light.secondary, marginLeft: 10, fontFamily: 'Inter' }}>{routeError ? '--' : `₹${baseFare}`}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {/* Book Button */}
            <TouchableOpacity
              style={{ backgroundColor: Colors.light.primary, borderRadius: 16, paddingVertical: 18, marginTop: 10, marginBottom: 10, shadowColor: Colors.light.primary, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 }}
              disabled={!!routeError || booking}
              onPress={handleBookRide}
            >
              <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 20, color: Colors.light.surface, fontFamily: 'Inter' }}>{booking ? 'Booking...' : `Book ${selected === 'bike' ? 'Bike' : 'Auto'}`}</Text>
            </TouchableOpacity>
            {bookingError && <Text style={{ color: '#e53935', textAlign: 'center', marginTop: 4, fontFamily: 'Inter' }}>{bookingError}</Text>}
          </>
        )}
      </View>
      {bookingStep === 'driver' && assignedDriver && (
        <View style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: Colors.light.card,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 0,
          paddingBottom: 16,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
          zIndex: 20,
        }}>
          {/* Driver Info Section */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 }}>
            <View style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: Colors.light.primary + '22',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14
            }}>
              {assignedDriver?.profilePhotoUrl ? (
                <Image
                  source={{ uri: assignedDriver.profilePhotoUrl }}
                  style={{ width: 54, height: 54, borderRadius: 27 }}
                  resizeMode="cover"
                />
              ) : (
                <Icon name="account" size={36} color={Colors.light.primary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 17, color: Colors.light.secondary, fontFamily: 'Inter' }}>{assignedDriver?.name || 'N/A'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Icon
                  name={assignedDriver?.vehicleType === 'bike' ? 'motorbike' : 'rickshaw'}
                  size={16}
                  color={Colors.light.secondary + '99'}
                  style={{ marginRight: 4 }}
                />
                <Text style={{ fontSize: 13, color: Colors.light.secondary + '99', fontFamily: 'Inter' }}>
                  {assignedDriver?.bikeModel || assignedDriver?.autoModel || 'N/A'}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', minWidth: 90 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Icon name="card-account-details" size={14} color={Colors.light.secondary + '99'} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 13, color: Colors.light.secondary + '99', fontFamily: 'Inter' }}>{assignedDriver?.license || 'N/A'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="car" size={14} color={Colors.light.secondary + '99'} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 13, color: Colors.light.secondary + '99', fontFamily: 'Inter', fontWeight: '600' }}>{assignedDriver?.vehicle || 'N/A'}</Text>
              </View>
            </View>
          </View>
          {/* Status below driver info */}
          <Text style={{ textAlign: 'left', color: Colors.light.primary, fontWeight: 'bold', fontSize: 14, marginLeft: 18, marginTop: 2, marginBottom: 8, fontFamily: 'Inter' }}>{rideStatus === 'Driver on the way' ? 'Captain is on his way' : rideStatus === 'Ride in progress' ? 'Ride in progress' : 'Completed'}</Text>
          {/* Ride Details Box */}
          <View style={{ backgroundColor: Colors.light.card, borderRadius: 16, marginHorizontal: 20, padding: 10, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: Colors.light.primary }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: Colors.light.secondary, fontFamily: 'Inter' }}>RIDE DETAILS</Text>
            </View>
            {/* Pickup and Dropoff with vertical line */}
            <View style={{ flexDirection: 'column', marginLeft: 0 }}>
              {/* Pickup Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 28 }}>
                <Text style={{ fontSize: 12, color: '#888', width: 50, fontFamily: 'Inter', textAlign: 'right' }}>
                  {/* Approx pickup time */}
                  {(() => {
                    if (duration) {
                      const now = new Date();
                      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                    return '--';
                  })()}
                </Text>
                <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#CC5803', marginBottom: 0 }} />
                </View>
                <Text style={{ fontSize: 13, color: Colors.light.secondary, fontFamily: 'Inter', flex: 1, marginLeft: 2 }}>{pickupAddress || '--'}</Text>
              </View>
              {/* Vertical line and arrow */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', minHeight: 24 }}>
                <Text style={{ width: 50 }} />
                <View style={{ width: 24, alignItems: 'center' }}>
                  <View style={{ width: 2, height: 20, backgroundColor: '#CC5803', marginVertical: 0 }} />
                  <Icon name="arrow-down" size={20} color="#888" style={{ marginTop: -4 }} />
                </View>
                <View style={{ flex: 1 }} />
              </View>
              {/* Dropoff Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 28 }}>
                <Text style={{ fontSize: 12, color: '#888', width: 50, fontFamily: 'Inter', textAlign: 'right', top: -20 }}>
                  {/* Approx dropoff time */}
                  {(() => {
                    if (duration) {
                      const now = new Date();
                      const drop = new Date(now.getTime() + duration.value * 1000);
                      return drop.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                    return '--';
                  })()}
                </Text>
                <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }} />
                <Text style={{ fontSize: 13, color: Colors.light.secondary, fontFamily: 'Inter', flex: 1, marginBottom: 1, top: -20 }}>
                  {dropoffAddress || '--'}
                </Text>
              </View>
            </View>
          </View>
          {/* Payment Row */}
          <View style={{
            marginHorizontal: 18,
            marginBottom: 10,
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 5,
            borderWidth: 1,
            borderColor: Colors.light.card,
          }}>

            {/* Mode of Payment */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 15, color: Colors.light.secondary, fontFamily: 'Inter' }}>
                Mode of Payment
              </Text>
              <Text style={{ fontWeight: 'bold', fontSize: 15, color: Colors.light.primary, fontFamily: 'Inter' }}>
                {paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'online' ? 'Prepaid' : '--'}
              </Text>
            </View>

            {/* Ride Fare */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 15, color: Colors.light.secondary, fontFamily: 'Inter' }}>
                Ride Fare
              </Text>
              <Text style={{ fontWeight: 'bold', fontSize: 15, color: Colors.light.secondary, fontFamily: 'Inter' }}>
                Rs.{typeof getFare() === 'number' ? getFare() : '--'}
              </Text>
            </View>

          </View>

          {/* Contact Driver and Cancel Buttons */}
          <View style={{ flexDirection: 'row', marginHorizontal: 20, gap: 12 }}>
            <TouchableOpacity
              onPress={() => assignedDriver?.mobile && Linking.openURL(`tel:${assignedDriver.mobile}`)}
              style={{
                flex: 1,
                backgroundColor: Colors.light.primary,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 4
              }}
            >
              <Text style={{ color: Colors.light.surface, fontWeight: 'bold', fontSize: 16, fontFamily: 'Inter' }}>Contact Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancelRide}
              style={{
                flex: 1,
                backgroundColor: '#e53935',
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 4
              }}
            >
              <Text style={{ color: Colors.light.surface, fontWeight: 'bold', fontSize: 16, fontFamily: 'Inter' }}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Payment Confirmation Modal */}
      <Modal visible={showPaymentModal} transparent animationType="fade" onRequestClose={handleClosePaymentModal}>
        <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: Colors.light.surface, borderRadius: 20, padding: 32, alignItems: 'center', width: '80%' }}>
            <Icon name="check-circle" size={48} color="#34C759" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.light.secondary, marginBottom: 8, fontFamily: 'Inter' }}>Payment received</Text>
            <Text style={{ fontSize: 15, color: Colors.light.secondary, textAlign: 'center', fontFamily: 'Inter', marginBottom: 16 }}>Thank you for riding with us!</Text>
            <TouchableOpacity onPress={handleClosePaymentModal} style={{ backgroundColor: Colors.light.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}>
              <Text style={{ color: Colors.light.surface, fontWeight: 'bold', fontSize: 16, fontFamily: 'Inter' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}