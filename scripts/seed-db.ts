import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLookupData() {
  try {
    console.log('Seeding Lookup Data...');

    await seedNotificationTypes();
    await seedNotificationStatuses();
    await seedFeedbackVisibility();
    await seedFeedbackRequestStatuses();
    await seedRolesAndPermissions();
    await seedTags();

    console.log('All lookup data seeded successfully.');
  } catch (error) {
    console.error('Error seeding lookup data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function seedNotificationTypes() {
  const notificationTypes = [
    { code: 'NEW_FEEDBACK', name: 'New Feedback' },
    { code: 'MEETING_INVITE', name: 'Meeting Invite' },
    { code: 'OKR_UPDATE', name: 'OKR Update' },
    { code: 'GENERAL_ALERT', name: 'General Alert' },
    { code: 'FEEDBACK_REQUEST', name: 'Feedback Request' },
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

async function seedFeedbackVisibility() {
  const feedbackVisibility = [
    { code: 'PUBLIC', name: 'Public' },
    { code: 'PRIVATE', name: 'Private' },
    { code: 'MANAGER_PRIVATE', name: 'Manager + Private' },
    { code: 'MANAGER_ONLY', name: 'Manager Only' },
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

async function seedFeedbackRequestStatuses() {
  const feedbackRequestStatuses = [
    { code: 'PENDING', name: 'Pending' },
    { code: 'COMPLETED', name: 'Completed' },
    { code: 'DECLINED', name: 'Declined' },
  ];

  for (const status of feedbackRequestStatuses) {
    await prisma.lookup.upsert({
      where: { code: status.code },
      update: {},
      create: {
        code: status.code,
        name: status.name,
        category: {
          connectOrCreate: {
            where: { code: 'FEEDBACK_REQUEST_STATUS' },
            create: {
              code: 'FEEDBACK_REQUEST_STATUS',
              name: 'Feedback Request Status',
            },
          },
        },
      },
    });
  }
}

async function seedRolesAndPermissions() {
  // Default roles to be created
  const roles = [
    { name: 'Admin' },
    { name: 'Employee' },
    { name: 'Manager' },
    { name: 'HR' },
    { name: 'DepartmentHead' },
    { name: 'Executive' },
  ];

  // Default permissions for the app
  const permissions = [
    { name: 'view_meetings', label: 'View Meetings' },
    { name: 'create_meeting', label: 'Create Meeting' },
    { name: 'edit_meeting', label: 'Edit Meeting' },
    { name: 'delete_meeting', label: 'Delete Meeting' },
    { name: 'attend_meeting', label: 'Attend Meeting' },
    { name: 'schedule_meeting', label: 'Schedule Meeting for Others' },
    { name: 'give_feedback', label: 'Give Feedback' },
    { name: 'view_given_feedback', label: 'View Given Feedback' },
    { name: 'request_feedback', label: 'Request Feedback' },
    { name: 'view_received_feedback', label: 'View Received Feedback' },
    { name: 'edit_feedback', label: 'Edit Feedback' },
    { name: 'manage_feedback_requests', label: 'Manage Feedback Requests' },
    { name: 'create_okr', label: 'Create OKRs' },
    { name: 'edit_okr', label: 'Edit OKRs' },
    { name: 'view_okr', label: 'View OKRs' },
    { name: 'delete_okr', label: 'Delete OKRs' },
    { name: 'approve_okr', label: 'Approve OKRs' },
    { name: 'manage_okr_progress', label: 'Manage OKR Progress' },
    { name: 'manage_users', label: 'Manage Users' },
    { name: 'manage_roles', label: 'Manage Roles' },
    { name: 'manage_departments', label: 'Manage Departments' },
    { name: 'view_company_data', label: 'View Company Data' },
    {
      name: 'assign_employee_to_department',
      label: 'Assign Employee to Department',
    },
    { name: 'assign_employee_to_manager', label: 'Assign Manager to Employee' },
    { name: 'create_role', label: 'Create Role' },
    { name: 'delete_role', label: 'Delete Role' },
  ];

  // Seed permissions if they don't exist already
  for (const permission of permissions) {
    await prisma.permissions.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  console.log('Permissions seeded successfully.');

  // Seed roles
  for (const role of roles) {
    await prisma.roles.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
      },
    });
  }

  console.log('Roles seeded successfully.');

  // Get the Admin role by name
  const adminRole = await prisma.roles.findUnique({
    where: { name: 'Admin' },
  });

  // Get all permissions
  const allPermissions = await prisma.permissions.findMany();

  // Assign all permissions to the Admin role
  for (const permission of allPermissions) {
    await prisma.role_permissions.upsert({
      where: {
        role_id_permission_id: {
          role_id: adminRole.id,
          permission_id: permission.id,
        },
      },
      update: {},
      create: {
        role_id: adminRole.id,
        permission_id: permission.id,
      },
    });
  }

  console.log('Admin role assigned all permissions successfully.');
}

seedRolesAndPermissions().catch((error) => {
  console.error('Error seeding roles and permissions:', error);
});

async function seedTags() {
  const genericTags = [
    { name: 'Leadership', description: 'Demonstrates strong leadership' },
    { name: 'Teamwork', description: 'Works well in teams' },
    { name: 'Communication', description: 'Clear and effective communication' },
    { name: 'Initiative', description: 'Takes initiative' },
    { name: 'Problem Solving', description: 'Good at solving problems' },
    { name: 'Creativity', description: 'Shows creativity in work' },
    { name: 'Adaptability', description: 'Adapts to changes easily' },
    { name: 'Collaboration', description: 'Collaborates effectively' },
    {
      name: 'Accountability',
      description: 'Takes responsibility for outcomes',
    },
    {
      name: 'Growth Mindset',
      description: 'Focuses on learning and improvement',
    },
  ];

  for (const tag of genericTags) {
    await prisma.tags.upsert({
      where: { name: tag.name },
      update: {},
      create: {
        name: tag.name,
        description: tag.description,
        audit: {}, // optional if you use it
      },
    });
  }

  console.log('Generic tags seeded successfully.');
}

seedLookupData();
