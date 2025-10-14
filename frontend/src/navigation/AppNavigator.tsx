import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PostRegisterScreen from '../screens/PostRegisterScreen';   
import HomeScreen from '../screens/HomeScreen';
import HomeGestorScreen from '../screens_gestor/HomeGestorScreen';
import RegistroCanchasScreen from '../screens_gestor/RegistroCanchasScreen';
import CanchasRegistradasScreen from '../screens_gestor/CanchasResgistradasScreen';  
import SolicitudesReservasScreen from '../screens_gestor/SolicitudesReservasScreen';


const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="PostRegister" component={PostRegisterScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="HomeGestor" component={HomeGestorScreen}/>
      <Stack.Screen name="RegistroCanchas" component={RegistroCanchasScreen}/>
      <Stack.Screen name="CanchasRegistradas" component={CanchasRegistradasScreen}/>
      <Stack.Screen name="SolicitudesReservas" component={SolicitudesReservasScreen}/>



      
    </Stack.Navigator>
  );
}
