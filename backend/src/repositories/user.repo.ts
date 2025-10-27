import { prisma } from '.././config/prisma';

export const UserRepo = {
  findByEmail: (correo: string) =>
    prisma.usuarios.findUnique({ where: { correo } }),

  create: (data: {
    nombre: string;
    apellidos: string;
    ci: string;
    correo: string;
    contrasena: string;
    rol: 'cliente' | 'administrador';
    telefono?: string;
    foto_perfil?: string;
  }) => prisma.usuarios.create({ data }),

  findById: (id: string) =>
    prisma.usuarios.findUnique({ where: { id } }),

  /** ✅ Nuevo método para actualizar el rol del usuario */
  updateRole: (id: string, rol: 'cliente' | 'administrador') =>
    prisma.usuarios.update({
      where: { id },
      data: { rol },
    }),
};
