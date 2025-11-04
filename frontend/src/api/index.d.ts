declare module "../api/canchas" {
  export const CanchasAPI: {
    listar: () => Promise<any>;
    registrar: (payload: { nombre: string; tipo: string }) => Promise<any>;
  };
}