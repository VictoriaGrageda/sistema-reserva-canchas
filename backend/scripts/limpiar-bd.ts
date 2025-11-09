/**
 * Script para limpiar todos los datos de la base de datos
 * ADVERTENCIA: Este script eliminará TODOS los datos de forma IRREVERSIBLE
 */

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function limpiarBaseDeDatos() {
  console.log('⚠️  ADVERTENCIA: Este script borrará TODOS los datos de la base de datos');
  console.log('🗑️  Iniciando limpieza de la base de datos...\n');

  try {
    // Borrar en orden inverso de dependencias
    console.log('🔄 Borrando notificaciones...');
    const notificaciones = await prisma.notificaciones.deleteMany({});
    console.log(`✅ ${notificaciones.count} notificaciones borradas`);

    console.log('🔄 Borrando pagos...');
    const pagos = await prisma.pagos.deleteMany({});
    console.log(`✅ ${pagos.count} pagos borrados`);

    console.log('🔄 Borrando QRs...');
    const qrs = await prisma.qrs.deleteMany({});
    console.log(`✅ ${qrs.count} QRs borrados`);

    console.log('🔄 Borrando items de reservas...');
    const reservaItems = await prisma.reserva_items.deleteMany({});
    console.log(`✅ ${reservaItems.count} items de reservas borrados`);

    console.log('🔄 Borrando reservas...');
    const reservas = await prisma.reservas.deleteMany({});
    console.log(`✅ ${reservas.count} reservas borradas`);

    console.log('🔄 Borrando horarios...');
    const horarios = await prisma.horarios.deleteMany({});
    console.log(`✅ ${horarios.count} horarios borrados`);

    console.log('🔄 Borrando configuraciones de horarios...');
    const configuraciones = await prisma.configuraciones_horarios.deleteMany({});
    console.log(`✅ ${configuraciones.count} configuraciones borradas`);

    console.log('🔄 Borrando canchas...');
    const canchas = await prisma.canchas.deleteMany({});
    console.log(`✅ ${canchas.count} canchas borradas`);

    console.log('🔄 Borrando complejos...');
    const complejos = await prisma.complejos.deleteMany({});
    console.log(`✅ ${complejos.count} complejos borrados`);

    console.log('🔄 Borrando usuarios...');
    const usuarios = await prisma.usuarios.deleteMany({});
    console.log(`✅ ${usuarios.count} usuarios borrados`);

    console.log('\n✅ ¡Todos los datos han sido borrados exitosamente!');
    console.log('📊 Resumen:');
    console.log(`   - Usuarios: ${usuarios.count}`);
    console.log(`   - Complejos: ${complejos.count}`);
    console.log(`   - Canchas: ${canchas.count}`);
    console.log(`   - Configuraciones: ${configuraciones.count}`);
    console.log(`   - Horarios: ${horarios.count}`);
    console.log(`   - Reservas: ${reservas.count}`);
    console.log(`   - Items de reservas: ${reservaItems.count}`);
    console.log(`   - QRs: ${qrs.count}`);
    console.log(`   - Pagos: ${pagos.count}`);
    console.log(`   - Notificaciones: ${notificaciones.count}`);

  } catch (error) {
    console.error('❌ Error al limpiar la base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

limpiarBaseDeDatos()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
