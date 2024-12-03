import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('Resetting database...');

    // Disable foreign key constraints temporarily
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

    // Truncate all tables and reset sequences
    const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);

    for (const table of tables) {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${table.table_name}" RESTART IDENTITY CASCADE;`,
      );
    }

    // Re-enable foreign key constraints
    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);

    console.log('Database reset successfully, including ID sequences!');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
