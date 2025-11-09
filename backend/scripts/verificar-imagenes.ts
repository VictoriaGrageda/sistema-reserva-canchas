import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function verificarImagenes() {
  console.log('🔍 Verificando imágenes guardadas en la BD...\n');

  // 1. Verificar QRs
  const qrs = await prisma.qrs.findMany({
    select: {
      id: true,
      admin_id: true,
      imagen_qr: true,
      vigente: true,
      created_at: true,
    },
  });

  console.log(`📊 Total de QRs: ${qrs.length}\n`);

  qrs.forEach((qr, index) => {
    console.log(`QR #${index + 1}:`);
    console.log(`  ID: ${qr.id}`);
    console.log(`  Admin ID: ${qr.admin_id}`);
    console.log(`  Vigente: ${qr.vigente}`);
    console.log(`  Tamaño: ${qr.imagen_qr?.length || 0} caracteres`);
    console.log(`  Tipo: ${qr.imagen_qr?.substring(0, 50) || 'Sin imagen'}...`);
    console.log('');
  });

  // 2. Verificar comprobantes de pagos
  const pagos = await prisma.pagos.findMany({
    where: {
      comprobante: {
        not: null,
      },
    },
    select: {
      id: true,
      comprobante: true,
      estado: true,
      created_at: true,
      reserva: {
        select: {
          id: true,
          usuario: {
            select: {
              nombre: true,
              apellidos: true,
            },
          },
        },
      },
    },
  });

  console.log(`\n📊 Total de pagos con comprobante: ${pagos.length}\n`);

  pagos.forEach((pago, index) => {
    console.log(`Pago #${index + 1}:`);
    console.log(`  ID: ${pago.id}`);
    console.log(`  Usuario: ${pago.reserva.usuario.nombre} ${pago.reserva.usuario.apellidos}`);
    console.log(`  Estado: ${pago.estado}`);
    console.log(`  Tamaño comprobante: ${pago.comprobante?.length || 0} caracteres`);
    console.log(`  Tipo: ${pago.comprobante?.substring(0, 50) || 'Sin comprobante'}...`);
    console.log('');
  });

  await prisma.$disconnect();
}

verificarImagenes().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
