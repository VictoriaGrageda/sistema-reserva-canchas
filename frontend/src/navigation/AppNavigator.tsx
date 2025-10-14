import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useAuth } from '../context/AuthContext';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PostRegisterScreen from '../screens/PostRegisterScreen';

import HomeScreen from '../screens/HomeScreen';
import HomeGestorScreen from '../screens_gestor/HomeGestorScreen';
import RegistroCanchasScreen from '../screens_gestor/RegistroCanchasScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Sin sesión
  if (!user) {
    return (
      <Stack.Navigator
        key="public"                             // 👈 fuerza remount del stack público
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="PostRegister" component={PostRegisterScreen} />
      </Stack.Navigator>
    );
  }

  // Con sesión: por rol
  if (user.rol === 'administrador') {
    return (
      <Stack.Navigator
        key="admin"                              // 👈 fuerza remount cuando entra/sale admin
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="HomeGestor" component={HomeGestorScreen} />
        <Stack.Screen name="RegistroCanchas" component={RegistroCanchasScreen} />
        <Stack.Screen name="PostRegister" component={PostRegisterScreen} />
      </Stack.Navigator>
    );
  }

  // Cliente
  return (
    <Stack.Navigator
      key="client"                                // 👈 fuerza remount para cliente
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PostRegister" component={PostRegisterScreen} />
    </Stack.Navigator>
  );
}
