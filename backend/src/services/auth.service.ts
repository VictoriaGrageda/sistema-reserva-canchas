// src/services/auth.service.ts
import { UserRepo } from '../repositories/user.repo';
import { RegisterInput } from '../validations/auth.schema';
import { hash } from '../utils/password';

export const AuthService = {
  async register(dto: RegisterInput) {
    // ¿correo ya existe?
    const exists = await UserRepo.findByEmail(dto.correo);
    if (exists) {
      const err: any = new Error('El correo ya está registrado');
      err.status = 409;
      throw err;
    }

    // hash de contraseña
    const hashed = await hash(dto.contrasena);

    // crear usuario
    const user = await UserRepo.create({
      nombre: dto.nombre,
      correo: dto.correo,
      contrasena: hashed,
      rol: dto.rol ?? 'cliente',
      telefono: dto.telefono,
      foto_perfil: dto.foto_perfil,
    });

    // nunca devolver la contraseña
    const { contrasena, ...safe } = user as any;
    return safe;
  },
};
