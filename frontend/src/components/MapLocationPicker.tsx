import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { MapPressEvent, Marker } from 'react-native-maps';
import colors from '../theme/colors';
import { LocationIQResult, LocationIQService } from '../services/locationiq';

export type LocationSelection = LocationIQResult;

const DEFAULT_REGION = {
  latitude: -17.78324,
  longitude: -63.18233,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export type ViewerMarker = {
  id: string;
  kind: "complejo" | "cancha";
  label?: string;
  location: LocationSelection;
};

type Props = {
  visible: boolean;
  initialLocation?: LocationSelection | null;
  onConfirm: (location: LocationSelection) => void;
  onCancel: () => void;
  viewerMode?: boolean;
  viewerMarkers?: ViewerMarker[] | null;
  onViewerMarkerPress?: (marker: ViewerMarker) => void;
};

export default function MapLocationPicker({
  visible,
  initialLocation,
  onConfirm,
  onCancel,
  viewerMode = false,
  viewerMarkers = null,
  onViewerMarkerPress,
}: Props) {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [selected, setSelected] = useState<LocationSelection | null>(initialLocation ?? null);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [address, setAddress] = useState(initialLocation?.address ?? '');
  const [error, setError] = useState<string | null>(null);

  const tieneCoordValida = (lat?: number, lng?: number) =>
    typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    if (!visible) return;
    if (initialLocation) {
      if (!tieneCoordValida(initialLocation.latitude, initialLocation.longitude)) {
        setRegion(DEFAULT_REGION);
        setSelected(null);
        setAddress('');
        setError('Ubicación inválida');
        return;
      }
      setRegion({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      setSelected(initialLocation);
      setAddress(initialLocation.address);
    } else {
      setRegion(DEFAULT_REGION);
      setSelected(null);
      setAddress('');
    }
    setSearchText('');
    setError(null);
  }, [visible, initialLocation]);

  const handleMapPress = useCallback(async (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setRegion((prev) => ({ ...prev, latitude, longitude }));
    setError(null);
    try {
      const result = await LocationIQService.reverse(latitude, longitude);
      setSelected(result);
      setAddress(result.address);
    } catch (err: any) {
      const fallback = {
        latitude,
        longitude,
        address: `Lat ${latitude.toFixed(5)}, Lon ${longitude.toFixed(5)}`,
      };
      setSelected(fallback);
      setAddress(fallback.address);
      setError(err?.message || 'No se pudo obtener la direccion');
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) {
      setError('Ingresa una direccion para buscar.');
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const result = await LocationIQService.search(searchText.trim());
      setRegion({
        latitude: result.latitude,
        longitude: result.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
      setSelected(result);
      setAddress(result.address);
    } catch (err: any) {
      setError(err?.message || 'No se encontraron coincidencias.');
    } finally {
      setSearching(false);
    }
  }, [searchText]);

  const handleConfirm = () => {
    if (!selected) {
      setError('Selecciona un punto en el mapa.');
      return;
    }
    onConfirm(selected);
  };

  useEffect(() => {
    if (viewerMode && viewerMarkers && viewerMarkers.length > 0) {
      const first = viewerMarkers.find((marker) =>
        tieneCoordValida(marker.location.latitude, marker.location.longitude)
      );
      if (!first) return;
      setRegion({
        latitude: first.location.latitude,
        longitude: first.location.longitude,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      });
    }
  }, [viewerMode, viewerMarkers]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.modalCard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Text style={styles.title}>{viewerMode ? 'Ubicación' : 'Selecciona ubicación'}</Text>
          {!viewerMode && (
            <View style={styles.searchRow}>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Buscar direccion"
                style={styles.searchInput}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
                {searching ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.searchBtnText}>Buscar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          {!viewerMode && error ? <Text style={styles.errorText}>{error}</Text> : null}
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={viewerMode ? undefined : setRegion}
            onPress={viewerMode ? undefined : handleMapPress}
          >
            {viewerMode && viewerMarkers && viewerMarkers.length > 0 ? (
              viewerMarkers.map((marker) => (
                <Marker
                  key={`${marker.id}-${marker.location.latitude}-${marker.location.longitude}`}
                  coordinate={{
                    latitude: marker.location.latitude,
                    longitude: marker.location.longitude,
                  }}
                  title={marker.label}
                  onPress={() => onViewerMarkerPress?.(marker)}
                />
              ))
            ) : (
              selected && (
                <Marker coordinate={{ latitude: selected.latitude, longitude: selected.longitude }} />
              )
            )}
          </MapView>
          {!viewerMode && (
            <Text style={styles.addressLabel} numberOfLines={2} ellipsizeMode="tail">
              {address || 'Sin direccion aun'}
            </Text>
          )}
          {viewerMode ? (
            <View style={styles.viewerActionRow}>
              <TouchableOpacity style={styles.viewerBackBtn} onPress={onCancel}>
                <Text style={styles.viewerBackText}>Volver</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={onCancel}>
                <Text style={styles.actionBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={handleConfirm}
              >
                <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    gap: 12,
    minHeight: '78%',
  },
  title: {
    fontWeight: '800',
    fontSize: 18,
    color: colors.dark,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E6EE',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: colors.green,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  errorText: { color: '#b00020', fontSize: 12 },
  map: {
    width: '100%',
    height: 320,
    borderRadius: 16,
  },
  addressLabel: {
    color: colors.dark,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  actionBtnPrimary: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  actionBtnText: {
    fontWeight: '700',
    color: colors.dark,
  },
  actionBtnTextPrimary: {
    color: '#fff',
  },
  viewerActionRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  viewerBackBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: colors.green,
  },
  viewerBackText: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
