import { View, Image, StyleSheet, Alert, ScrollView } from 'react-native';
import colors from '../theme/colors';
import type { NavProps } from '../navigation/types';
import { useState } from 'react';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';

export default function RegisterScreen({ navigation }: NavProps<'Register'>) {
  const [state, setState] = useState({ nombres: '', apellidos: '', correo: '', ci: '', celular: '', pass: '', pass2: '' });
  const set = (k: keyof typeof state) => (v: string) => setState(s => ({ ...s, [k]: v }));

  const submit = () => {
    if (!state.correo || !state.pass) return Alert.alert('Registro', 'Completa correo y contraseña');
    if (state.pass !== state.pass2) return Alert.alert('Registro', 'Las contraseñas no coinciden');
    Alert.alert('Registro', '¡Cuenta creada!', [{ text: 'OK', onPress: () => navigation.replace('Login') }]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.green }} contentContainerStyle={styles.container}>
      <Image source={require('../../assets/images/ball.png')} style={styles.ball} />
      <View style={styles.card}>
        <FormInput label="Nombre/s" value={state.nombres} onChangeText={set('nombres')} />
        <FormInput label="Apellidos" value={state.apellidos} onChangeText={set('apellidos')} />
        <FormInput label="Correo Electrónico" autoCapitalize="none" keyboardType="email-address" value={state.correo} onChangeText={set('correo')} />
        <FormInput label="Nro CI" value={state.ci} onChangeText={set('ci')} />
        <FormInput label="Celular" keyboardType="phone-pad" value={state.celular} onChangeText={set('celular')} />
        <FormInput label="Contraseña" secureTextEntry value={state.pass} onChangeText={set('pass')} />
        <FormInput label="Confirmar Contraseña" secureTextEntry value={state.pass2} onChangeText={set('pass2')} />
        <PrimaryButton title="Registrarse" onPress={submit} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  ball: { width: 90, height: 90, marginVertical: 18, resizeMode: 'contain' },
  card: { width: '100%', borderRadius: 16, backgroundColor: colors.white, padding: 16, gap: 8, elevation: 2 },
});
