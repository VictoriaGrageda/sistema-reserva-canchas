// src/services/complejos.service.ts
import { ComplejosRepo } from '../repositories/complejos.repo';

export const ComplejosService = {
  // Crear un nuevo complejo (con o sin canchas)
  crear: (data: any) => ComplejosRepo.createIncludeCanchas(data),

  // Listar todos los complejos (con filtros opcionales)
  listar: (ciudad?: string, nombre?: string) => ComplejosRepo.list({ ciudad, nombre }),

  // Listar los complejos por admin_id
  listarPorAdmin: (admin_id: string) => ComplejosRepo.listByAdmin(admin_id),

  // Obtener un complejo por su id
  obtener: (id: string) => ComplejosRepo.getIncludeCanchas(id),

  actualizar: (id: string, data: any) => ComplejosRepo.update(id, data),

};
