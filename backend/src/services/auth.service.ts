import { UserRepo } from '../repositories/user.repo';
import { RegisterInput } from '../validations/auth.schema';
import { hash } from '../utils/password';

export const AuthService = {
  async register(dto: RegisterInput) {
    const correo = dto.correo.trim().toLowerCase();

    // pre-chequeo para UX
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
      // Prisma unique constraint
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
  },
};
