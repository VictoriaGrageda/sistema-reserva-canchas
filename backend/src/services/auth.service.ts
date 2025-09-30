import { UserRepo } from '../repositories/user.repo';
import { RegisterInput } from '../validations/auth.schema';
import { hash } from '../utils/password';
import { compare } from "../utils/password";
import { signToken } from "../lib/jwt";
import type { LoginInput } from "../validations/auth.schema";

export const register = async (dto : RegisterInput) => {
    const correo = dto.correo.trim().toLowerCase();

    const exists = await UserRepo.findByEmail(correo);
    if (exists) {
      const err: any = new Error('El correo ya está registrado');
      err.status = 409;
      throw err;
    }

    const hashed = await hash(dto.contrasena);

    try {
      const user = await UserRepo.create({
        nombre: dto.nombre,
        apellidos: dto.apellidos,
        ci: dto.ci,
        correo,                
        contrasena: hashed,
        rol: 'cliente',        
        telefono: dto.telefono,
        foto_perfil: dto.foto_perfil,
      });

      const { contrasena, ...safe } = user as any;
      return safe;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        const target = Array.isArray(e.meta?.target) ? e.meta.target.join(',') : String(e.meta?.target ?? '');
        const err: any = new Error(
          target.includes('ci') ? 'El CI ya está registrado' : 'El correo ya está registrado'
        );
        err.status = 409;
        throw err;
      }
      throw e;
    }
  };

// LOGIN (usa UserRepo.findByEmail)
export const login = async (dto: LoginInput) => {
  const correo = dto.correo.trim().toLowerCase();

  const user = await UserRepo.findByEmail(correo);
  if (!user) {
    const err: any = new Error("Credenciales inválidas");
    err.status = 401;
    throw err;
  }

  const ok = await compare(dto.contrasena, user.contrasena);
  if (!ok) {
    const err: any = new Error("Credenciales inválidas");
    err.status = 401;
    throw err;
  }

  const token = signToken({ id: user.id, correo: user.correo, rol: user.rol });

  const { contrasena, ...safeUser } = user as any;

  const expiresIn = 24 * 60 * 60; 

  return { user: safeUser, token, expiresIn };
};

