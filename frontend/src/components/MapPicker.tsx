import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

interface MapPickerProps {
  initialLocation?: { latitude: number; longitude: number };
  onLocationSelect: (location: { latitude: number; longitude: number; address?: string }) => void;
  height?: number;
}

export default function MapPicker({
  initialLocation,
  onLocationSelect,
  height = 300
}: MapPickerProps) {
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.latitude || -16.5000, // La Paz, Bolivia
    longitude: initialLocation?.longitude || -68.1500,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación para mostrar el mapa.');
        return;
      }
    })();
  }, []);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSelectedLocation(newLocation);

      // Geocoding inverso para obtener dirección
      try {
        const addresses = await Location.reverseGeocodeAsync(newLocation);
        if (addresses.length > 0) {
          const addr = addresses[0];
          const formattedAddress = [
            addr.street,
            addr.name,
            addr.city,
            addr.region,
            addr.country
          ].filter(Boolean).join(', ');

          onLocationSelect({ ...newLocation, address: formattedAddress });
        } else {
          onLocationSelect(newLocation);
        }
      } catch (error) {
        onLocationSelect(newLocation);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación. Verifica que el GPS esté activado.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newLocation = { latitude, longitude };
    setSelectedLocation(newLocation);

    // Geocoding inverso para obtener dirección
    try {
      const addresses = await Location.reverseGeocodeAsync(newLocation);
      if (addresses.length > 0) {
        const addr = addresses[0];
        const formattedAddress = [
          addr.street,
          addr.name,
          addr.city,
          addr.region,
          addr.country
        ].filter(Boolean).join(', ');

        onLocationSelect({ ...newLocation, address: formattedAddress });
      } else {
        onLocationSelect(newLocation);
      }
    } catch (error) {
      console.error('Error en geocoding:', error);
      onLocationSelect(newLocation);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Ubicación seleccionada"
            description="Mantén presionado para mover"
            draggable
            onDragEnd={handleMapPress}
          />
        )}
      </MapView>

      {/* Instrucciones */}
      <View style={styles.instructionBox}>
        <Text style={styles.instructionText}>Toca el mapa para seleccionar ubicación</Text>
      </View>

      {/* Botón de ubicación actual */}
      <TouchableOpacity
        style={styles.currentLocationBtn}
        onPress={getCurrentLocation}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="locate" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6F1E9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  map: {
    flex: 1,
  },
  instructionBox: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 10,
    borderRadius: 8,
    elevation: 3,
  },
  instructionText: {
    fontSize: 12,
    color: colors.dark,
    textAlign: 'center',
    fontWeight: '600',
  },
  currentLocationBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
