import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { GOOGLE_MAPS_API_KEY } from '../../constants/Keys';

type LatLng = { latitude: number; longitude: number };
type PlaceSuggestion = {
  placePrediction?: {
    placeId: string;
    structuredFormat?: {
      mainText?: { text: string };
      secondaryText?: { text: string };
    };
    types?: string[];
  };
  // Optionally, for queryPrediction if you want to support it in the future
  queryPrediction?: any;
};

type LocationPickerScreenProps = {
  navigation: any;
};

export default function LocationPickerScreen({ navigation }: LocationPickerScreenProps) {
  const [currentLocation, setCurrentLocation] = useState('');
  const [currentCoords, setCurrentCoords] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);
  const [editingCurrent, setEditingCurrent] = useState(false);

  // Fetch device location on mount
  useEffect(() => {
    (async () => {
      setLocating(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentLocation('Permission denied');
        setLocating(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setCurrentCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      // Reverse geocode to get address
      let geocode = await Location.reverseGeocodeAsync(loc.coords);
      if (geocode && geocode.length > 0) {
        const { name, street, city, region } = geocode[0];
        setCurrentLocation(`${name || ''} ${street || ''}, ${city || ''}, ${region || ''}`.trim());
      } else {
        setCurrentLocation(`${loc.coords.latitude}, ${loc.coords.longitude}`);
      }
      setLocating(false);
    })();
  }, []);

  // Fetch Google Places Autocomplete suggestions for destination
  const handleDestinationChange = async (text: string) => {
    setDestination(text);
    if (!text) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types',
        },
        body: JSON.stringify({
          input: text,
          // Optionally add locationBias, origin, etc.
        }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Google Places Autocomplete suggestions for current location
  const handleCurrentLocationChange = async (text: string) => {
    setCurrentLocation(text);
    setEditingCurrent(true);
    if (!text) {
      setCurrentSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types',
        },
        body: JSON.stringify({
          input: text,
          // Optionally add locationBias, origin, etc.
        }),
      });
      const data = await res.json();
      setCurrentSuggestions(data.suggestions || []);
    } catch (e) {
      setCurrentSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch place details and navigate for destination
  const handleSelectDestination = async (item: PlaceSuggestion) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${item.placePrediction?.placeId}?fields=location&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      const location = data.location;
      if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        navigation.replace('BookingScreen', {
          currentLocation: currentCoords || { latitude: 24.5854, longitude: 73.7125 },
          destination: item.placePrediction?.structuredFormat?.mainText?.text,
          destinationCoords: location,
        });
      } else {
        // Optionally show an error to the user
      }
    } catch (e) {
      // Optionally show an error to the user
    } finally {
      setLoading(false);
    }
  };

  // Fetch place details and update current location
  const handleSelectCurrent = async (item: PlaceSuggestion) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${item.placePrediction?.placeId}?fields=location&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      const location = data.location;
      if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
        setCurrentCoords(location);
        setCurrentLocation(item.placePrediction?.structuredFormat?.mainText?.text || '');
        setEditingCurrent(false);
        setCurrentSuggestions([]);
      } else {
        // Optionally show an error to the user
      }
    } catch (e) {
      // Optionally show an error to the user
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background, paddingTop: 30, paddingHorizontal: 18 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 1, padding: 8, borderRadius: 10, backgroundColor: Colors.light.surface }}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: Colors.light.secondary, fontFamily: 'Inter' }}>Drop</Text>
      </View>
      {/* Location Inputs */}
      <View style={{ backgroundColor: Colors.light.card, borderRadius: 18, padding: 18, marginBottom: 18, shadowColor: Colors.light.primary, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#43a047', marginRight: 10 }} />
          <TextInput
            style={{ flex: 1, fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter' }}
            value={currentLocation}
            onChangeText={handleCurrentLocationChange}
            placeholder="Your Current Location"
            editable
            onFocus={() => setEditingCurrent(true)}
            placeholderTextColor={Colors.light.secondary + '99'}
          />
          {locating && <ActivityIndicator size="small" style={{ marginLeft: 10 }} color={Colors.light.primary} />}
        </View>
        {editingCurrent && currentSuggestions.length > 0 && (
          <FlatList
            data={currentSuggestions}
            keyExtractor={(item, idx) => item.placePrediction?.placeId || String(idx)}
            renderItem={({ item }) => (
              <TouchableOpacity style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.light.background }} onPress={() => handleSelectCurrent(item)}>
                <Text style={{ fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter' }}>{item.placePrediction?.structuredFormat?.mainText?.text}</Text>
                <Text style={{ fontSize: 12, color: Colors.light.secondary + '99', fontFamily: 'Inter' }}>{item.placePrediction?.structuredFormat?.secondaryText?.text}</Text>
              </TouchableOpacity>
            )}
            style={{ maxHeight: 180, backgroundColor: Colors.light.surface, borderRadius: 12, marginBottom: 8 }}
          />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#e53935', marginRight: 10 }} />
          <TextInput
            style={{ flex: 1, fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter' }}
            value={destination}
            onChangeText={handleDestinationChange}
            placeholder="Enter destination"
            placeholderTextColor={Colors.light.secondary + '99'}
          />
          {destination.length > 0 && (
            <TouchableOpacity onPress={() => setDestination('')}>
              <Ionicons name="close" size={18} color={Colors.light.secondary + '99'} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* Select on map button */}
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
        <Ionicons name="map" size={18} color={Colors.light.primary} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter' }}>Select on map</Text>
      </TouchableOpacity>
      {/* Suggestions for destination */}
      {loading && <ActivityIndicator style={{ marginVertical: 16 }} color={Colors.light.primary} />}
      <FlatList
        data={suggestions}
        keyExtractor={(item, idx) => item.placePrediction?.placeId || String(idx)}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.light.background }} onPress={() => handleSelectDestination(item)}>
            <Text style={{ fontSize: 16, color: Colors.light.secondary, fontFamily: 'Inter' }}>{item.placePrediction?.structuredFormat?.mainText?.text}</Text>
            <Text style={{ fontSize: 12, color: Colors.light.secondary + '99', fontFamily: 'Inter' }}>{item.placePrediction?.structuredFormat?.secondaryText?.text}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={destination && !loading ? <Text style={{ textAlign: 'center', color: Colors.light.secondary + '55', marginTop: 32, fontFamily: 'Inter' }}>No results</Text> : null}
      />
    </View>
  );
}
