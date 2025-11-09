import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function verificarQRs() {
  const qrs = await prisma.qrs.findMany({
    include: {
      admin: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          rol: true,
        },
      },
    },
  });

  console.log(`\n📊 Total de QRs en la base de datos: ${qrs.length}\n`);

  if (qrs.length === 0) {
    console.log('❌ No hay QRs configurados');
    console.log('💡 Los administradores deben subir un QR al crear canchas o complejos');
  } else {
    qrs.forEach((qr, index) => {
      console.log(`${index + 1}. QR ID: ${qr.id}`);
      console.log(`   Admin: ${qr.admin.nombre} ${qr.admin.apellidos} (${qr.admin.rol})`);
      console.log(`   Vigente: ${qr.vigente ? '✅ Sí' : '❌ No'}`);
      console.log(`   Imagen: ${qr.imagen_qr.substring(0, 50)}...`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

verificarQRs().catch(console.error);
