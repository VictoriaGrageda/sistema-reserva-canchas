import { View, Image, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import colors from '../theme/colors';
import type { NavProps } from '../navigation/types';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';

export default function LoginScreen({ navigation }: NavProps<'Login'>) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');

  const login = () => {
    if (!email || !pwd) return Alert.alert('Login', 'Completa tus credenciales');
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/ball.png')} style={styles.ball} />
      <View style={styles.card}>
        <FormInput label="Correo" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <FormInput label="Contraseña" secureTextEntry value={pwd} onChangeText={setPwd} />
        <PrimaryButton title="Ingresar" onPress={login} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#128055', padding: 20, alignItems: 'center', justifyContent: 'center' },
  ball: { width: 90, height: 90, marginBottom: 18, resizeMode: 'contain' },
  card: { width: '100%', borderRadius: 16, backgroundColor: colors.white, padding: 16, gap: 8 },
});
