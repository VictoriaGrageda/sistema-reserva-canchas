import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import colors from '../theme/colors';

type Props = TextInputProps & { label?: string; errorText?: string };

export default function FormInput({ label, errorText, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput style={[styles.input, style]} placeholderTextColor={colors.gray} {...rest} />
      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  label: { marginBottom: 6, color: colors.dark, fontWeight: '600' },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
  },
  error: { color: colors.red, marginTop: 4, fontSize: 12 },
});
