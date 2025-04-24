import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';
const prisma = new PrismaClient();

const departmentData = [
  {
    name: 'Engineering',
    head: 2,
    departmentId: 1,
    companyId: 1,
    members: [2, 5, 8, 9, 10],
    okrs: [
      {
        title: 'Improve Engineering Quality',
        description:
          'Focus on reducing bugs, improving test automation, and release speed.',
        startDate: '2025-04-01',
        dueDate: '2025-06-30',
        keyResults: [
          { title: 'Reduce bugs reported by 30%', progress: 25 },
          { title: 'Automate 80% of test cases', progress: 50 },
          { title: 'Improve CI/CD pipeline reliability to 95%', progress: 20 },
        ],
      },
      {
        title: 'Increase Team Productivity',
        startDate: '2025-04-15',
        dueDate: '2025-07-15',
        keyResults: [
          { title: 'Improve sprint velocity by 20%', progress: 40 },
          { title: 'Hold weekly retros with 100% attendance', progress: 60 },
        ],
      },
    ],
  },
  {
    name: 'Marketing',
    head: 3,
    departmentId: 2,
    companyId: 1,
    members: [3, 6, 10, 11, 12],
    okrs: [
      {
        title: 'Boost Brand Awareness',
        startDate: '2025-05-01',
        dueDate: '2025-07-10',
        keyResults: [
          { title: 'Increase social engagement by 25%', progress: 30 },
          { title: 'Launch 3 influencer campaigns', progress: 60 },
        ],
      },
      {
        title: 'Improve Website Conversions',
        startDate: '2025-05-15',
        dueDate: '2025-08-01',
        keyResults: [
          { title: 'Improve homepage bounce rate by 15%', progress: 10 },
          {
            title: 'Launch targeted landing pages for 3 campaigns',
            progress: 50,
          },
        ],
      },
    ],
  },
  {
    name: 'Sales',
    head: 4,
    departmentId: 3,
    companyId: 1,
    members: [4, 7, 13, 14, 8],
    okrs: [
      {
        title: 'Increase Q2 Revenue',
        startDate: '2025-04-01',
        dueDate: '2025-06-30',
        keyResults: [
          { title: 'Close 20 enterprise deals', progress: 70 },
          { title: 'Upsell to 10 existing clients', progress: 40 },
        ],
      },
      {
        title: 'Expand Sales Pipeline',
        startDate: '2025-05-01',
        dueDate: '2025-07-20',
        keyResults: [
          { title: 'Generate 100 new qualified leads', progress: 50 },
          { title: 'Improve CRM usage compliance to 100%', progress: 60 },
        ],
      },
    ],
  },
];

async function seedOkrs() {
  for (const dept of departmentData) {
    for (const okr of dept.okrs) {
      const dueDate = new Date(okr.dueDate);
      const startDate = okr.startDate
        ? new Date(okr.startDate)
        : subDays(dueDate, 30); // fallback: 30 days before due

      const created = await prisma.okrs.create({
        data: {
          title: okr.title,
          description: okr.description ?? '',
          start_date: startDate,
          due_date: dueDate,
          company_id: dept.companyId,
          department_id: dept.departmentId,
          user_id: dept.head,
          assigned_to: {
            create: dept.members.map((user_id) => ({
              user: { connect: { user_id } },
            })),
          },
          key_results: {
            create: okr.keyResults.map((kr) => ({
              title: kr.title,
              progress: kr.progress,
            })),
          },
          audit: {
            createdAt: new Date().toISOString(),
            createdBy: dept.head,
          },
        },
      });

      console.log(
        `✅ Created OKR "${okr.title}" for ${dept.name} (ID: ${created.id})`,
      );
    }
  }

  await prisma.$disconnect();
}

seedOkrs();
