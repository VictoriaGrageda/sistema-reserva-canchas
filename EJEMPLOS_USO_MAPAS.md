# 📱 Ejemplos de Uso de Mapas en las Pantallas

## 📍 1. RegistroComplejoDeportivoScreen

### **Antes de empezar:**
Asegúrate de haber instalado las dependencias:
```bash
npm install expo-location react-native-maps
```

### **Código a agregar:**

```typescript
// 1. Agregar imports al inicio del archivo
import MapPicker from '../components/MapPicker';

// 2. Agregar estados para coordenadas y dirección
const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
const [direccionCompleta, setDireccionCompleta] = useState("");

// 3. Reemplazar el botón de ubicación actual por el MapPicker

// ELIMINAR ESTO:
<TouchableOpacity style={styles.locationBtn} onPress={onSelectUbicacion} activeOpacity={0.85}>
  <Ionicons name="location-outline" size={18} color={colors.dark} />
  <Text style={styles.locationText}>{ubicacion ?? "Seleccione Ubicación"}</Text>
</TouchableOpacity>

// AGREGAR ESTO EN SU LUGAR:
<Text style={styles.groupTitle}>Ubicación del Complejo</Text>

<MapPicker
  initialLocation={coords ? { latitude: coords.lat, longitude: coords.lng } : undefined}
  onLocationSelect={(location) => {
    setCoords({ lat: location.latitude, lng: location.longitude });
    if (location.address) {
      setDireccionCompleta(location.address);
      setUbicacion(location.address); // Si quieres mantener el estado existente
    }
  }}
  height={280}
/>

{direccionCompleta ? (
  <View style={styles.addressBox}>
    <Ionicons name="location" size={16} color={colors.green} />
    <Text style={styles.addressText}>{direccionCompleta}</Text>
  </View>
) : null}

// 4. En el payload del registro, usar las coordenadas:
const payload = {
  // ... otros campos
  lat: coords?.lat,
  lng: coords?.lng,
  direccion: direccionCompleta || ubicacion || undefined,
  ciudad: "La Paz", // O extraerlo de la dirección
};

// 5. Agregar estos estilos al StyleSheet:
addressBox: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  backgroundColor: '#E7F6EE',
  padding: 12,
  borderRadius: 10,
  marginTop: 8,
},
addressText: {
  flex: 1,
  fontSize: 13,
  color: colors.dark,
  fontWeight: '600',
},
```

---

## 📍 2. RegistroCanchasScreen

Similar al anterior, para registro de canchas individuales:

```typescript
// Agregar estados
const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
const [direccion, setDireccion] = useState("");

// Reemplazar sección de ubicación con MapPicker
<Text style={styles.groupTitle}>Ubicación de la Cancha</Text>

<MapPicker
  onLocationSelect={(location) => {
    setCoords({ lat: location.latitude, lng: location.longitude });
    if (location.address) {
      setDireccion(location.address);
    }
  }}
  height={250}
/>

// En el payload:
const canchaPayload: RegistrarCanchaPayload = {
  // ... otros campos
  lat: coords?.lat,
  lng: coords?.lng,
  direccion: direccion || undefined,
};
```

---

## 📍 3. ReservarCanchasScreen - Mostrar ubicación de complejos

```typescript
// 1. Agregar import
import MapDisplay from '../components/MapDisplay';

// 2. En el render de cada complejo (dentro del map de complejos):
<View key={complejo.id} style={styles.card}>
  <View style={styles.cardHeader}>
    <Ionicons name="football" size={24} color={colors.green} />
    <Text style={styles.cardTitle}>{complejo.nombre}</Text>
  </View>

  {/* AGREGAR ESTO: Mostrar mapa si hay coordenadas */}
  {complejo.lat && complejo.lng && (
    <View style={{ marginVertical: 10 }}>
      <MapDisplay
        latitude={Number(complejo.lat)}
        longitude={Number(complejo.lng)}
        title={complejo.nombre}
        description={complejo.direccion}
        height={180}
        showDirectionsButton={true}
      />
    </View>
  )}

  {complejo.direccion && (
    <View style={styles.addressRow}>
      <Ionicons name="location-outline" size={16} color={colors.dark} />
      <Text style={styles.cardSubtitle}>{complejo.direccion}</Text>
    </View>
  )}

  <View style={styles.cardFooter}>
    <Text style={styles.precioText}>
      Diurno: {complejo.precioDiurnoPorHora} Bs/hr
    </Text>
    <Text style={styles.precioText}>
      Nocturno: {complejo.precioNocturnoPorHora} Bs/hr
    </Text>
  </View>
</View>

// 3. Agregar estilos:
addressRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 8,
},
```

---

## 📍 4. Vista Detalle de Cancha (Nueva pantalla opcional)

```typescript
// frontend/src/screens/DetalleCanchaScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { CanchasAPI } from '../api/canchas';
import MapDisplay from '../components/MapDisplay';
import colors from '../theme/colors';

export default function DetalleCanchaScreen({ route, navigation }) {
  const { canchaId } = route.params;
  const [cancha, setCancha] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDetalle();
  }, []);

  const cargarDetalle = async () => {
    try {
      const data = await CanchasAPI.detalle(canchaId);
      setCancha(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  if (!cancha) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{cancha.nombre}</Text>

      {/* Mapa */}
      {cancha.lat && cancha.lng && (
        <MapDisplay
          latitude={cancha.lat}
          longitude={cancha.lng}
          title={cancha.nombre}
          description={cancha.direccion}
          height={250}
        />
      )}

      {/* Información */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Tipo de Cancha:</Text>
        <Text style={styles.infoValue}>{cancha.tipoCancha}</Text>

        <Text style={styles.infoLabel}>Tipo de Campo:</Text>
        <Text style={styles.infoValue}>{cancha.tipoCampo}</Text>

        {cancha.precios && (
          <>
            <Text style={styles.infoLabel}>Precios:</Text>
            <Text style={styles.infoValue}>
              Diurno: {cancha.precios.diurno} Bs/hr
            </Text>
            <Text style={styles.infoValue}>
              Nocturno: {cancha.precios.nocturno} Bs/hr
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGreen,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.dark,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
    marginTop: 12,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    color: colors.dark,
    marginTop: 4,
  },
});
```

---

## 📍 5. Búsqueda por Cercanía (Feature Avanzado)

```typescript
// Agregar búsqueda por ubicación actual
import * as Location from 'expo-location';

const buscarCercanos = async () => {
  try {
    // 1. Obtener ubicación actual
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'No podemos buscar canchas cercanas sin tu ubicación.');
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    // 2. Buscar complejos
    const resultados = await ComplejosAPI.buscar({});

    // 3. Calcular distancias y ordenar
    const conDistancia = resultados.map((complejo) => {
      if (!complejo.lat || !complejo.lng) {
        return { ...complejo, distancia: Infinity };
      }

      const distance = calcularDistancia(
        latitude,
        longitude,
        complejo.lat,
        complejo.lng
      );

      return { ...complejo, distancia: distance };
    });

    // 4. Ordenar por cercanía
    conDistancia.sort((a, b) => a.distancia - b.distancia);
    setComplejos(conDistancia);
  } catch (error) {
    console.error(error);
  }
};

// Función para calcular distancia (fórmula de Haversine)
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia en km
};

// En el render, mostrar distancia:
<Text style={styles.distanceText}>
  📍 {complejo.distancia < 1
    ? `${(complejo.distancia * 1000).toFixed(0)} metros`
    : `${complejo.distancia.toFixed(1)} km`}
</Text>
```

---

## 🎨 Tips de UI/UX

### 1. **Loading States**
```typescript
{loading ? (
  <ActivityIndicator size="large" color={colors.green} />
) : (
  <MapPicker ... />
)}
```

### 2. **Error Handling**
```typescript
try {
  const location = await Location.getCurrentPositionAsync({});
} catch (error) {
  Alert.alert(
    'Error de GPS',
    'No se pudo obtener tu ubicación. Asegúrate de que el GPS esté activado.'
  );
}
```

### 3. **Placeholder mientras carga**
```typescript
<View style={styles.mapPlaceholder}>
  <Ionicons name="map" size={48} color="#CCC" />
  <Text>Cargando mapa...</Text>
</View>
```

---

## 📝 Checklist de Implementación

- [ ] Instalar dependencias (`expo-location`, `react-native-maps`)
- [ ] Obtener API Keys de Google Cloud
- [ ] Configurar `app.json` con API keys
- [ ] Agregar permisos de ubicación
- [ ] Crear componentes MapPicker y MapDisplay
- [ ] Integrar en RegistroComplejoDeportivoScreen
- [ ] Integrar en RegistroCanchasScreen
- [ ] Integrar en ReservarCanchasScreen
- [ ] Ejecutar `npx expo prebuild --clean`
- [ ] Probar en dispositivo real
- [ ] Agregar `.env` al `.gitignore`

---

## ⚠️ Notas Importantes

1. **Probar en dispositivo real:** Los mapas funcionan mejor en dispositivos reales que en emuladores
2. **Permisos:** Siempre pedir permisos antes de usar ubicación
3. **API Limits:** Google Maps tiene límites de uso gratuito
4. **Offline:** `react-native-maps` cachea tiles, funciona parcialmente offline
