import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function verificarCanchasIndividuales() {
  console.log('\n🔍 Verificando canchas individuales...\n');

  const canchas = await prisma.canchas.findMany({
    where: {
      complejo_id: null, // Canchas sin complejo = individuales
    },
    include: {
      admin: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          rol: true,
        },
      },
      horarios: {
        take: 3,
        where: {
          disponible: true,
        },
      },
      configuraciones_horarios: true,
    },
  });

  console.log(`📊 Total de canchas individuales: ${canchas.length}\n`);

  if (canchas.length === 0) {
    console.log('❌ No hay canchas individuales registradas');
  } else {
    for (const cancha of canchas) {
      console.log(`\n🏟️  Cancha: ${cancha.nombre}`);
      console.log(`   ID: ${cancha.id}`);
      console.log(`   Tipo: ${cancha.tipoCancha} - ${cancha.tipoCampo}`);
      console.log(`   Admin: ${cancha.admin?.nombre} ${cancha.admin?.apellidos} (${cancha.admin?.rol})`);
      console.log(`   Admin ID: ${cancha.admin_id}`);
      console.log(`   Configuraciones de horario: ${cancha.configuraciones_horarios.length}`);
      console.log(`   Horarios disponibles: ${cancha.horarios.length}`);

      // Verificar QR del admin
      if (cancha.admin_id) {
        const qrs = await prisma.qrs.findMany({
          where: { admin_id: cancha.admin_id },
        });
        console.log(`   QRs del admin: ${qrs.length}`);
        const qrVigente = qrs.find(q => q.vigente);
        if (qrVigente) {
          console.log(`   ✅ QR vigente encontrado: ${qrVigente.id}`);
        } else {
          console.log(`   ❌ No hay QR vigente para este admin`);
        }
      } else {
        console.log(`   ⚠️  No tiene admin_id asignado`);
      }
    }
  }

  await prisma.$disconnect();
}

verificarCanchasIndividuales().catch(console.error);
