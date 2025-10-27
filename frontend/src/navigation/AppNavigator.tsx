// navigation/AppNavigator.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';

// Screens públicas
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Selección de rol
import PostRegisterScreen from '../screens/PostRegisterScreen';

// Cliente
import HomeScreen from '../screens/HomeScreen';
import ReservarCanchasScreen from '../screens/ReservarCanchasScreen';
import ReservasRealizadasScreen from '../screens/ReservasRealizadasScreen';
import ConfiguracionesScreen from '../screens/ConfiguracionesScreen';
import HistorialReservasScreen from '../screens/HistorialReservasScreen'; 



// Administrador (gestor)
import HomeGestorScreen from '../screens_gestor/HomeGestorScreen';
import RegistroCanchasScreen from '../screens_gestor/RegistroCanchasScreen';
import CanchasRegistradasScreen from '../screens_gestor/CanchasResgistradasScreen';  
import SolicitudesReservasScreen from '../screens_gestor/SolicitudesReservasScreen';
import RegistroComplejoDeportivoScreen from 'src/screens_gestor/RegistroComplejoDeportivoScreen';




const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { loading, user, needsRoleChoice } = useAuth(); // ⬅️ usamos el flag

  // Loader global
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  // 1) Sin sesión → stack público
  if (!user) {
    return (
      <Stack.Navigator key="public" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        {/* PostRegister NO va en el stack público */}
      </Stack.Navigator>
    );
  }

  // 2) Debe elegir rol → SOLO PostRegister
  //    (prioriza el flag de UI y también soporta rol 'pendiente' del backend)
  if (needsRoleChoice || user.rol === 'pendiente') {
    return (
      <Stack.Navigator key="postreg" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PostRegister" component={PostRegisterScreen} />
      </Stack.Navigator>
    );
  }

  // 3) Rol administrador (gestor)
  if (user.rol === 'administrador') {
    return (
      <Stack.Navigator key="admin" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeGestor" component={HomeGestorScreen} />
        <Stack.Screen name="RegistroCanchas" component={RegistroCanchasScreen} />
        <Stack.Screen name="CanchasRegistradas" component={CanchasRegistradasScreen} />
        <Stack.Screen name="SolicitudesReservas" component={SolicitudesReservasScreen} />
        <Stack.Screen name="RegistroComplejoDeportivo" component={RegistroComplejoDeportivoScreen} />
        {/* No incluir PostRegister aquí */}
      </Stack.Navigator>
    );
  }

  // 4) Rol cliente
  return (
    <Stack.Navigator key="client" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="HomeGestor" component={HomeGestorScreen}/>
      <Stack.Screen name="RegistroCanchas" component={RegistroCanchasScreen}/>
      <Stack.Screen name="ReservarCanchas" component={ReservarCanchasScreen}/>
      <Stack.Screen name="ReservasRealizadas" component={ReservasRealizadasScreen}/>
      <Stack.Screen name="Configuraciones" component={ConfiguracionesScreen}/>
      <Stack.Screen name="HistorialReservas" component={HistorialReservasScreen}/>
      
      {/* No incluir PostRegister aquí */}
    </Stack.Navigator>
  );
}
