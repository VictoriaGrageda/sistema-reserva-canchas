import { CanchasRepo } from '../repositories/canchas.repo';

export const CanchasService = {
  crear: (data: any) => CanchasRepo.create(data),
  listarPorComplejo: (complejo_id: string) => CanchasRepo.listByComplejo(complejo_id),
  listarIndividuales: (filtros?: { ciudad?: string; nombre?: string }) =>
    CanchasRepo.listIndividuales(filtros),
  actualizar: (id: string, data: any) => CanchasRepo.update(id, data),
  eliminar: (id: string) => CanchasRepo.softDelete(id),
  misCanchas: (adminId: string) => CanchasRepo.listMine(adminId),
  detalle: (id: string) => CanchasRepo.findDetalle(id),
};
