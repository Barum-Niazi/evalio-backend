import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotificationLookup() {
  try {
    console.log('Seeding Notification Lookup Data...');

    // Insert Notification Types
    const notificationTypes = [
      { code: 'NEW_FEEDBACK', name: 'New Feedback' },
      { code: 'MEETING_INVITE', name: 'Meeting Invite' },
      { code: 'OKR_UPDATE', name: 'OKR Update' },
      { code: 'GENERAL_ALERT', name: 'General Alert' },
    ];

    for (const type of notificationTypes) {
      await prisma.lookup.upsert({
        where: { code: type.code },
        update: {},
        create: {
          code: type.code,
          name: type.name,
          category: {
            connectOrCreate: {
              where: { code: 'NOTIFICATION_TYPE' },
              create: { code: 'NOTIFICATION_TYPE', name: 'Notification Type' },
            },
          },
        },
      });
    }

    // Insert Notification Statuses
    const notificationStatuses = [
      { code: 'UNREAD', name: 'Unread' },
      { code: 'READ', name: 'Read' },
    ];

    for (const status of notificationStatuses) {
      await prisma.lookup.upsert({
        where: { code: status.code },
        update: {},
        create: {
          code: status.code,
          name: status.name,
          category: {
            connectOrCreate: {
              where: { code: 'NOTIFICATION_STATUS' },
              create: {
                code: 'NOTIFICATION_STATUS',
                name: 'Notification Status',
              },
            },
          },
        },
      });
    }

    console.log('✅ Notification lookup data seeded successfully.');
  } catch (error) {
    console.error('❌ Error seeding notification lookup data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNotificationLookup();
