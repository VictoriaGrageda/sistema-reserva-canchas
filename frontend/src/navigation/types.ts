import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  PostRegister: undefined;
  Home: undefined;
  HomeGestor: undefined;
  RegistroCanchas: undefined;
};

export type NavProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
