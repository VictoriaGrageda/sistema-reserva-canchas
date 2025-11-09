import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function crearQRPrueba() {
  // Admin ID del log
  const admin_id = '9bfc5f1c-713f-47c8-aa06-c20234f85eb8';

  // Verificar que el admin existe
  const admin = await prisma.usuarios.findUnique({
    where: { id: admin_id },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      rol: true,
    },
  });

  if (!admin) {
    console.log('❌ No se encontró el administrador con ID:', admin_id);
    return;
  }

  console.log('✅ Admin encontrado:', admin.nombre, admin.apellidos);
  console.log('   Rol:', admin.rol);

  // Crear un QR de prueba (puedes cambiar esta URL por una imagen QR real)
  const imagenQRPrueba = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BANCO:1234567890';

  const qr = await prisma.qrs.create({
    data: {
      admin_id: admin_id,
      imagen_qr: imagenQRPrueba,
      vigente: true,
    },
  });

  console.log('\n✅ QR creado exitosamente!');
  console.log('   ID:', qr.id);
  console.log('   Vigente:', qr.vigente);
  console.log('   Imagen:', qr.imagen_qr);

  await prisma.$disconnect();
}

crearQRPrueba().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
