import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotificationLookup() {
  try {
    console.log('Seeding Lookup Data...');

    // Seed Notification Types
    await seedNotificationTypes();

    // Seed Notification Statuses
    await seedNotificationStatuses();

    // Seed Feedback Visibility Types
    await seedFeedbackVisibility();

    console.log('All lookup data seeded successfully.');
  } catch (error) {
    console.error('Error seeding lookup data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Seed Notification Types
async function seedNotificationTypes() {
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
}

// Seed Notification Statuses
async function seedNotificationStatuses() {
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
}

// Seed Feedback Visibility Types
async function seedFeedbackVisibility() {
  const feedbackVisibility = [
    { code: 'PUBLIC', name: 'Public' },
    { code: 'PRIVATE', name: 'Private' },
    { code: 'COMPANY_ONLY', name: 'Company Only' },
    { code: 'ANONYMOUS', name: 'Anonymous' },
  ];

  for (const visibility of feedbackVisibility) {
    await prisma.lookup.upsert({
      where: { code: visibility.code },
      update: {},
      create: {
        code: visibility.code,
        name: visibility.name,
        category: {
          connectOrCreate: {
            where: { code: 'FEEDBACK_VISIBILITY' },
            create: {
              code: 'FEEDBACK_VISIBILITY',
              name: 'Feedback Visibility',
            },
          },
        },
      },
    });
  }
}

seedNotificationLookup();
