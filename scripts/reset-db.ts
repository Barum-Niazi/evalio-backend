import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('Resetting database...');
    // Disable foreign key constraints
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      EXECUTE 'TRUNCATE TABLE '
      || string_agg(format('%I.%I', schemaname, tablename), ', ')
      || ' CASCADE'
      FROM pg_tables
      WHERE schemaname = 'public';
    END $$;`);
    console.log('Database reset successfully!');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
