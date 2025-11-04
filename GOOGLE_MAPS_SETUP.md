# 📍 Guía de Implementación de Google Maps en React Native Expo

## 🎯 Opciones Disponibles

### **Opción 1: react-native-maps (Recomendada) ✅**
- **Pros:** Nativa, mejor rendimiento, funciona offline
- **Cons:** Requiere configuración de API keys
- **Ideal para:** Producción

### **Opción 2: WebView con Google Maps Embed**
- **Pros:** No requiere API keys complicadas
- **Cons:** Menor rendimiento, requiere internet
- **Ideal para:** Prototipado rápido

---

## 🚀 Implementación Opción 1: react-native-maps

### **Paso 1: Instalar Dependencias**

```bash
# Instalar paquetes necesarios
npx expo install expo-location react-native-maps

# O con npm
npm install expo-location react-native-maps
```

### **Paso 2: Obtener API Keys de Google**

#### **Para Android:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita estas APIs:
   - Maps SDK for Android
   - Maps SDK for iOS (si planeas iOS)
   - Places API (para búsqueda de lugares)
   - Geocoding API (para convertir direcciones a coordenadas)

4. Ve a "Credentials" → "Create Credentials" → "API Key"
5. Copia tu API Key
6. (Opcional) Restringe la clave por aplicación Android

#### **Para iOS:**

1. Misma consola de Google Cloud
2. Crea otra API Key (o usa la misma sin restricciones)
3. Configura las restricciones para iOS

### **Paso 3: Configurar app.json**

```json
{
  "expo": {
    "name": "frontend",
    "slug": "frontend",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "config": {
        "googleMapsApiKey": "TU_API_KEY_IOS_AQUI"
      },
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "Necesitamos tu ubicación para mostrar canchas cercanas."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "config": {
        "googleMaps": {
          "apiKey": "TU_API_KEY_ANDROID_AQUI"
        }
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Permitir acceso a ubicación para mostrar canchas cercanas."
        }
      ]
    ]
  }
}
```

### **Paso 4: Crear Variables de Entorno**

Crea o actualiza tu `.env`:

```bash
# frontend/.env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID=AIzaSy...tu-key-android
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS=AIzaSy...tu-key-ios
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_WEB=AIzaSy...tu-key-web
```

**⚠️ IMPORTANTE:** Agrega `.env` a tu `.gitignore`

### **Paso 5: Actualizar app.json para usar variables de entorno**

Si usas `expo-constants`, puedes referenciar las variables:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID"
    }
  }
}
```

---

## 📦 Componentes Reutilizables

### **1. MapPicker Component (Seleccionar Ubicación)**

```typescript
// frontend/src/components/MapPicker.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

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
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación.');
        return;
      }
    })();
  }, []);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener tu ubicación.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });

    // Obtener dirección (Geocoding inverso)
    try {
      const address = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address.length > 0) {
        const addr = address[0];
        const formattedAddress = `${addr.street || ''} ${addr.name || ''}, ${addr.city || ''}, ${addr.region || ''}`.trim();
        onLocationSelect({ latitude, longitude, address: formattedAddress });
      } else {
        onLocationSelect({ latitude, longitude });
      }
    } catch (error) {
      onLocationSelect({ latitude, longitude });
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Ubicación seleccionada"
          />
        )}
      </MapView>

      {/* Botón de ubicación actual */}
      <TouchableOpacity
        style={styles.currentLocationBtn}
        onPress={getCurrentLocation}
        disabled={loading}
      >
        <Ionicons name="locate" size={24} color="#fff" />
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
  },
  map: {
    flex: 1,
  },
  currentLocationBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1BD65A',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
```

### **2. MapDisplay Component (Mostrar Ubicación)**

```typescript
// frontend/src/components/MapDisplay.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface MapDisplayProps {
  latitude: number;
  longitude: number;
  title?: string;
  height?: number;
}

export default function MapDisplay({
  latitude,
  longitude,
  title = "Ubicación",
  height = 200
}: MapDisplayProps) {
  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={title}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6F1E9',
  },
  map: {
    flex: 1,
  },
});
```

---

## 🔧 Uso en tus Pantallas

### **En RegistroComplejoDeportivoScreen:**

```typescript
import MapPicker from '../components/MapPicker';

// En el estado
const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
const [direccion, setDireccion] = useState<string>("");

// En el render
<View>
  <Text style={styles.groupTitle}>Ubicación del Complejo</Text>

  <MapPicker
    initialLocation={coords ? { latitude: coords.lat, longitude: coords.lng } : undefined}
    onLocationSelect={(location) => {
      setCoords({ lat: location.latitude, lng: location.longitude });
      if (location.address) {
        setDireccion(location.address);
      }
    }}
    height={250}
  />

  {direccion && (
    <Text style={styles.addressText}>{direccion}</Text>
  )}
</View>

// En el payload del registro
const payload = {
  // ... otros campos
  lat: coords?.lat,
  lng: coords?.lng,
  direccion: direccion || undefined,
};
```

### **En ReservarCanchasScreen (Mostrar mapa):**

```typescript
import MapDisplay from '../components/MapDisplay';

// En el render de cada complejo
{complejo.lat && complejo.lng && (
  <MapDisplay
    latitude={complejo.lat}
    longitude={complejo.lng}
    title={complejo.nombre}
    height={150}
  />
)}
```

---

## 🌐 Opción 2: WebView Simple (Sin API Keys)

Si prefieres una solución más simple sin configurar API keys:

```typescript
// frontend/src/components/SimpleMapPicker.tsx
import React from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

interface SimpleMapPickerProps {
  onLocationSelect: (coords: { lat: number; lng: number }) => void;
  height?: number;
}

export default function SimpleMapPicker({ onLocationSelect, height = 300 }: SimpleMapPickerProps) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body, html { margin: 0; padding: 0; height: 100%; }
          #map { height: 100%; }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          let map;
          let marker;

          function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
              center: { lat: -16.5000, lng: -68.1500 },
              zoom: 13
            });

            map.addListener('click', (event) => {
              const lat = event.latLng.lat();
              const lng = event.latLng.lng();

              if (marker) marker.setMap(null);

              marker = new google.maps.Marker({
                position: { lat, lng },
                map: map
              });

              window.ReactNativeWebView.postMessage(JSON.stringify({ lat, lng }));
            });
          }

          initMap();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html: htmlContent }}
        onMessage={(event) => {
          const coords = JSON.parse(event.nativeEvent.data);
          onLocationSelect(coords);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});
```

---

## 📝 Comandos para Instalar

```bash
# Opción 1: react-native-maps (Recomendada)
npx expo install expo-location react-native-maps

# Opción 2: WebView
npx expo install react-native-webview

# Rebuild después de instalar
npx expo prebuild --clean
```

---

## 🧪 Testing

```bash
# Iniciar app
npm start

# Probar en Android
npm run android

# Probar en iOS (Mac solamente)
npm run ios
```

---

## ⚠️ Notas Importantes

1. **API Keys:** Nunca commitees las API keys. Usa variables de entorno.
2. **Permisos:** Asegúrate de solicitar permisos de ubicación antes de usar.
3. **Geocoding:** Tiene límites de uso gratuito (25,000 requests/día).
4. **Offline:** react-native-maps funciona parcialmente offline, WebView no.

---

## 🔒 Seguridad de API Keys

### **Restringir API Keys en Google Cloud:**

1. Ve a Google Cloud Console → Credentials
2. Edita tu API Key
3. Restricciones de aplicación:
   - Android: Agrega tu package name + SHA-1
   - iOS: Agrega tu bundle identifier
4. Restricciones de API:
   - Selecciona solo las APIs que necesitas

---

## 📚 Documentación Útil

- [Expo Location Docs](https://docs.expo.dev/versions/latest/sdk/location/)
- [react-native-maps Docs](https://github.com/react-native-maps/react-native-maps)
- [Google Maps Platform](https://developers.google.com/maps/documentation)

---

## ❓ Solución de Problemas

### **Error: "Google Maps API Key is invalid"**
- Verifica que la API key esté correctamente configurada en `app.json`
- Asegúrate de haber habilitado las APIs correctas en Google Cloud

### **Mapa no se muestra**
- Ejecuta `npx expo prebuild --clean`
- Verifica permisos en app.json
- Asegúrate de que expo-location esté instalado

### **Permisos denegados**
- Revisa que `NSLocationWhenInUseUsageDescription` esté en iOS
- Verifica `ACCESS_FINE_LOCATION` en Android
