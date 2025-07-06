import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { auth, db } from '../../constants/firebaseConfig';

interface RidesHistoryScreenProps {
    navigation: any;
}

interface Ride {
    id: string;
    pickup: { latitude: number; longitude: number };
    dropoff: { latitude: number; longitude: number };
    status: string;
    createdAt: any;
    fare?: number;
    driverName?: string;
    vehicleNumber?: string;
    vehicleType?: string;
    distance?: number;
    duration?: number;
    customerName?: string;
    customerPhone?: string;
}

interface RideWithAddresses extends Ride {
    pickupAddress?: string;
    dropoffAddress?: string;
}

export default function RidesHistoryScreen({ navigation }: RidesHistoryScreenProps) {
    const [rides, setRides] = useState<RideWithAddresses[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRidesHistory();
    }, []);

    const fetchRidesHistory = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                setError('User not authenticated');
                setLoading(false);
                return;
            }

            const ridesQuery = query(
                collection(db, 'rides'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(ridesQuery);
            const ridesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Ride[];

            // Convert coordinates to addresses
            const ridesWithAddresses = await Promise.all(
                ridesData.map(async (ride) => {
                    let pickupAddress = '';
                    let dropoffAddress = '';

                    try {
                        if (ride.pickup) {
                            const results = await Location.reverseGeocodeAsync(ride.pickup);
                            if (results && results.length > 0) {
                                const { name, street, city, district, region } = results[0];
                                pickupAddress = [name, street, city || district || region].filter(Boolean).join(', ');
                            } else {
                                pickupAddress = `${ride.pickup.latitude.toFixed(5)}, ${ride.pickup.longitude.toFixed(5)}`;
                            }
                        }

                        if (ride.dropoff) {
                            const results = await Location.reverseGeocodeAsync(ride.dropoff);
                            if (results && results.length > 0) {
                                const { name, street, city, district, region } = results[0];
                                dropoffAddress = [name, street, city || district || region].filter(Boolean).join(', ');
                            } else {
                                dropoffAddress = `${ride.dropoff.latitude.toFixed(5)}, ${ride.dropoff.longitude.toFixed(5)}`;
                            }
                        }
                    } catch (error) {
                        console.error('Error converting coordinates to addresses:', error);
                        if (ride.pickup) {
                            pickupAddress = `${ride.pickup.latitude.toFixed(5)}, ${ride.pickup.longitude.toFixed(5)}`;
                        }
                        if (ride.dropoff) {
                            dropoffAddress = `${ride.dropoff.latitude.toFixed(5)}, ${ride.dropoff.longitude.toFixed(5)}`;
                        }
                    }

                    return {
                        ...ride,
                        pickupAddress,
                        dropoffAddress
                    };
                })
            );

            setRides(ridesWithAddresses);
        } catch (error) {
            console.error('Error fetching rides history:', error);
            setError('Failed to load rides history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed':
                return '#4CAF50';
            case 'cancelled':
                return '#F44336';
            case 'Ride in progress':
                return '#2196F3';
            case 'Driver on the way':
                return '#FF9800';
            case 'booked':
                return '#9C27B0';
            case 'Arrived at pickup':
                return '#FF5722';
            default:
                return Colors.light.secondary;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'Completed';
            case 'cancelled':
                return 'Cancelled';
            case 'Ride in progress':
                return 'In Progress';
            case 'Driver on the way':
                return 'Driver Coming';
            case 'booked':
                return 'Booked';
            case 'Arrived at pickup':
                return 'Driver Arrived';
            default:
                return status;
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderRideItem = ({ item }: { item: RideWithAddresses }) => (
        <View style={{ backgroundColor: Colors.light.surface, borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.light.secondary, fontFamily: 'Inter' }}>
                    Ride #{item.id.slice(-6)}
                </Text>
                <View style={{
                    backgroundColor: getStatusColor(item.status) + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12
                }}>
                    <Text style={{
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: getStatusColor(item.status),
                        fontFamily: 'Inter'
                    }}>
                        {getStatusText(item.status)}
                    </Text>
                </View>
            </View>

            <View style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 8 }} />
                    <Text style={{ fontSize: 14, color: Colors.light.secondary, fontFamily: 'Inter', flex: 1 }}>
                        {item.pickupAddress || 'Location not available'}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F44336', marginRight: 8 }} />
                    <Text style={{ fontSize: 14, color: Colors.light.secondary, fontFamily: 'Inter', flex: 1 }}>
                        {item.dropoffAddress || 'Location not available'}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: Colors.light.secondary + '99', fontFamily: 'Inter' }}>
                    {formatDate(item.createdAt)}
                </Text>
                {item.fare && (
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: Colors.light.primary, fontFamily: 'Inter' }}>
                        ₹{item.fare}
                    </Text>
                )}
            </View>

            {/* Additional ride details */}
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.light.background }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: Colors.light.secondary + '99', fontFamily: 'Inter' }}>
                        Vehicle: {item.vehicleType === 'bike' ? 'Bike' : item.vehicleType === 'auto' ? 'Auto' : 'Unknown'}
                    </Text>
                    {item.distance && (
                        <Text style={{ fontSize: 12, color: Colors.light.secondary + '99', fontFamily: 'Inter' }}>
                            {(item.distance / 1000).toFixed(1)} km
                        </Text>
                    )}
                </View>
                {item.driverName && (
                    <Text style={{ fontSize: 12, color: Colors.light.secondary + '99', fontFamily: 'Inter' }}>
                        Driver: {item.driverName}
                        {item.vehicleNumber && ` • ${item.vehicleNumber}`}
                    </Text>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
                <Text style={{ color: Colors.light.secondary, fontSize: 16, fontFamily: 'Inter' }}>Loading rides history...</Text>
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
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.light.secondary, fontFamily: 'Inter' }}>Rides History</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={fetchRidesHistory}>
                    <Ionicons name="refresh" size={24} color={Colors.light.primary} />
                </TouchableOpacity>
            </View>

            {error ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                    <Text style={{ color: '#F44336', fontSize: 16, textAlign: 'center', fontFamily: 'Inter', marginBottom: 16 }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        style={{ backgroundColor: Colors.light.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                        onPress={fetchRidesHistory}
                    >
                        <Text style={{ color: 'white', fontSize: 14, fontFamily: 'Inter' }}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : rides.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
                    <Ionicons name="car-outline" size={64} color={Colors.light.secondary + '50'} style={{ marginBottom: 16 }} />
                    <Text style={{ color: Colors.light.secondary, fontSize: 18, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Inter', marginBottom: 8 }}>
                        No rides yet
                    </Text>
                    <Text style={{ color: Colors.light.secondary + '99', fontSize: 14, textAlign: 'center', fontFamily: 'Inter' }}>
                        Your ride history will appear here once you book your first ride
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={rides}
                    renderItem={renderRideItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
} 