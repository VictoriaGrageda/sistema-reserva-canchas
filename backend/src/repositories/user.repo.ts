import { prisma } from '.././config/prisma';
export const UserRepo = {
findByEmail: (correo: string) =>
    prisma.usuarios.findUnique({ where: { correo } }),

create: (data: {
    nombre: string;
    correo: string;
    contrasena: string;
    rol: 'cliente' | 'administrador';
    telefono?: string;
    foto_perfil?: string;
}) =>
    prisma.usuarios.create({ data }),

  // útil después para perfil
findById: (id: string) => prisma.usuarios.findUnique({ where: { id } }),
};
