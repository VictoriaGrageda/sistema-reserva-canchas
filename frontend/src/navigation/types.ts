import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  PostRegister: undefined;
  Home: undefined;
  HomeGestor: undefined;
  RegistroCanchas: undefined;
  CanchasRegistradas: undefined;
  SolicitudesReservas: undefined;
  Configuraciones: undefined;
  HistorialReservas: undefined;
  ReservarCanchas: undefined;
  ReservasRealizadas: undefined;
  RegistroComplejoDeportivo: undefined;
  ConfirmarReserva: {
    cancha: {
      id: string;
      nombre: string;
      tipoCancha: string;
      tipoCampo: string;
    };
    complejo?: {
      id: string;
      nombre: string;
    };
    horarios: Array<{
      id: string;
      hora_inicio: string;
      hora_fin: string;
      fecha: string;
      precio: number;
    }>;
  };
  DetalleReservaQR: {
    reserva_id: string;
  };
  EditarCancha: {
    cancha_id: string;
  };
};

export type NavProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
