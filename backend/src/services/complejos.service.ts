import { ComplejosRepo } from '../repositories/complejos.repo';

export const ComplejosService = {
  crear: (data: any) => ComplejosRepo.create(data),
  listarPorAdmin: (admin_id: string) => ComplejosRepo.listByAdmin(admin_id),
  obtener: (id: string) => ComplejosRepo.get(id),
};
