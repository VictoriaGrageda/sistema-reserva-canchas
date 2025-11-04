@echo off
echo 🗺️  Instalando dependencias de Google Maps...
echo.

cd frontend

REM Instalar dependencias
echo 📦 Instalando expo-location y react-native-maps...
call npx expo install expo-location react-native-maps

echo.
echo ✅ Dependencias instaladas correctamente!
echo.
echo 📋 PROXIMOS PASOS:
echo.
echo 1. Obtén API Keys de Google Cloud Console:
echo    https://console.cloud.google.com/
echo.
echo 2. Habilita estas APIs:
echo    - Maps SDK for Android
echo    - Maps SDK for iOS
echo    - Geocoding API
echo.
echo 3. Crea archivo .env en frontend\ con:
echo    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_ANDROID=tu-key-aqui
echo    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS=tu-key-aqui
echo.
echo 4. Actualiza app.json con las API keys
echo.
echo 5. Ejecuta: npx expo prebuild --clean
echo.
echo 📖 Lee GOOGLE_MAPS_SETUP.md para más detalles
echo.
pause
