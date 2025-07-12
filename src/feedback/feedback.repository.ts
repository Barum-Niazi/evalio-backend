import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { feedback } from '@prisma/client';
import { startOfMonth, endOfMonth, endOfWeek, startOfWeek } from 'date-fns';

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getVisibilityId(visibilityType: string): Promise<number> {
    const visibility = await this.prisma.lookup.findFirst({
      where: {
        code: visibilityType, // Match the code for visibility type (e.g., "PUBLIC")
        category: {
          code: 'FEEDBACK_VISIBILITY', // Ensure it belongs to the "Feedback Visibility" category
        },
      },
    });

    if (!visibility) {
      throw new Error(
        `Visibility type "${visibilityType}" not found in the "FEEDBACK_VISIBILITY" category.`,
      );
    }

    return visibility.id;
  }

  async createFeedback(
    feedbackTitle: string,
    feedbackText: string,
    senderId: number,
    receiverId: number,
    isAnonymous: boolean,
    visibilityType: string,
    sentiment: string,
  ): Promise<feedback> {
    const visibilityId = await this.getVisibilityId(visibilityType);
    const createdFeedback = this.prisma.feedback.create({
      data: {
        title: feedbackTitle,
        feedback_text: feedbackText,
        is_anonymous: isAnonymous,
        visibility_id: visibilityId,
        sender_id: senderId,
        receiver_id: receiverId,
        audit: {},
        sentiment: sentiment, // Save the sentiment analysis result
      },
    });

    return createdFeedback;
  }

  async getFeedbackById(feedbackId: number): Promise<feedback | null> {
    return this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });
  }

  async getAllFeedback(
    senderId?: number,
    receiverId?: number,
  ): Promise<feedback[]> {
    return this.prisma.feedback.findMany({
      where: {
        sender_id: senderId ? senderId : undefined,
        receiver_id: receiverId ? receiverId : undefined,
      },
      orderBy: { id: 'desc' }, // Latest feedback first
    });
  }

  // feedback.repository.ts
  async getFeedbackByUser(userId: number): Promise<feedback[]> {
    const feedback = await this.prisma.feedback.findMany({
      where: {
        OR: [{ sender_id: userId }, { receiver_id: userId }],
      },
      orderBy: { id: 'desc' },
      include: {
        visibility: true, // for visibilityType string
        sender: {
          select: {
            user_id: true,
            name: true,
          },
        },
        receiver: {
          select: {
            user_id: true,
            name: true,
            company_id: true,
          },
        },
      },
    });
    return feedback;
  }

  /**
   * ✅ Update feedback entry.
   */
  async updateFeedback(
    feedbackId: number,
    feedbackText?: string,
    isAnonymous?: boolean,
    visibilityId?: number,
  ): Promise<feedback> {
    return this.prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        feedback_text: feedbackText,
        is_anonymous: isAnonymous,
        visibility_id: visibilityId,
      },
    });
  }

  async getFeedbackByEmployeeId(employeeId: number): Promise<any[]> {
    const feedback = await this.prisma.feedback.findMany({
      where: {
        OR: [{ sender_id: employeeId }, { receiver_id: employeeId }],
      },
      orderBy: { id: 'desc' },
      include: {
        visibility: true, // for visibilityType string
        sender: {
          select: {
            user_id: true,
            name: true,
          },
        },
        receiver: {
          select: {
            user_id: true,
            name: true,
            company_id: true,
          },
        },
      },
    });

    const feedbackIds = feedback.map((fb) => fb.id);

    const feedbackTags = await this.prisma.tagged_entities.findMany({
      where: {
        entity_id: { in: feedbackIds },
        entity_type: 'FEEDBACK',
      },
      include: {
        tag: true,
      },
    });

    return feedback.map((fb) => {
      const tags = feedbackTags
        .filter((tagEntity) => tagEntity.entity_id === fb.id)
        .map((tagEntity) => tagEntity.tag);

      return {
        ...fb,
        tags,
      };
    });
  }

  async getAllFeedbackWithVisibility(): Promise<any[]> {
    return this.prisma.feedback.findMany({
      orderBy: { id: 'desc' },
      include: {
        visibility: true,
        sender: {
          select: { user_id: true, name: true },
        },
        receiver: {
          select: {
            user_id: true,
            name: true,
            manager_id: true,
            company_id: true,
          },
        },
      },
    });
  }

  async deleteFeedback(feedbackId: number): Promise<void> {
    await this.prisma.feedback.delete({
      where: { id: feedbackId },
    });
  }

  async getFeedbackByCompany(companyId: number) {
    return this.prisma.feedback.findMany({
      where: {
        receiver: {
          company_id: companyId,
        },
      },
      select: {
        id: true,
        sentiment: true,
        is_anonymous: true,
        date: true,
      },
    });
  }

  async getFeedbackEngagement(companyId: number) {
    const users = await this.prisma.user_details.findMany({
      where: {
        company_id: companyId,
      },
      select: {
        user_id: true,
        name: true,
        profile_blob_id: true,
        designation: {
          select: {
            title: true,
          },
        },
      },
    });

    const [givenCounts, receivedCounts] = await Promise.all([
      this.prisma.feedback.groupBy({
        by: ['sender_id'],
        _count: true,
        where: {
          sender: {
            company_id: companyId,
          },
        },
      }),
      this.prisma.feedback.groupBy({
        by: ['receiver_id'],
        _count: true,
        where: {
          receiver: {
            company_id: companyId,
          },
        },
      }),
    ]);

    const givenMap = new Map<number, number>();
    givenCounts.forEach((entry) => {
      if (entry.sender_id !== null) {
        givenMap.set(entry.sender_id, entry._count);
      }
    });

    const receivedMap = new Map<number, number>();
    receivedCounts.forEach((entry) => {
      if (entry.receiver_id !== null) {
        receivedMap.set(entry.receiver_id, entry._count);
      }
    });

    return users.map((user) => ({
      userId: user.user_id,
      name: user.name,
      designation: user.designation?.title ?? null,
      profileImageUrl: user.profile_blob_id
        ? `/blob/${user.profile_blob_id}/view`
        : null,
      given: givenMap.get(user.user_id) ?? 0,
      received: receivedMap.get(user.user_id) ?? 0,
    }));
  }

  async getTopFeedbackGivers(companyId: number) {
    const result = await this.prisma.$queryRawUnsafe<
      {
        sender_id: number;
        name: string;
        profile_blob_id: number | null;
        designation: string | null;
        feedback_given: number;
      }[]
    >(
      `
    SELECT
      f.sender_id,
      ud.name,
      ud.profile_blob_id,
      d.title AS designation,
      COUNT(*) AS feedback_given
    FROM feedback f
    JOIN user_details ud ON f.sender_id = ud.user_id
    LEFT JOIN designation d ON ud.designation_id = d.id
    WHERE ud.company_id = $1
    GROUP BY f.sender_id, ud.name, ud.profile_blob_id, d.title
    ORDER BY feedback_given DESC
    LIMIT 5;
    `,
      companyId,
    );

    return result.map((row) => ({
      userId: row.sender_id,
      name: row.name,
      designation: row.designation,
      profileImageUrl: row.profile_blob_id
        ? `/blob/${row.profile_blob_id}/view`
        : null,
      feedbackGiven: Number(row.feedback_given),
    }));
  }

  async getFeedbackByDepartment(companyId: number) {
    const departments = await this.prisma.department.findMany({
      where: {
        company: {
          id: companyId,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const departmentMap = new Map<number, string>();
    departments.forEach((d) => departmentMap.set(d.id, d.name));

    const feedbacks = await this.prisma.feedback.findMany({
      where: {
        sender: {
          company_id: companyId,
          department_id: {
            not: null,
          },
        },
      },
      select: {
        sender: {
          select: {
            department_id: true,
          },
        },
      },
    });

    const countMap = new Map<number, number>();
    for (const fb of feedbacks) {
      const deptId = fb.sender?.department_id;
      if (deptId) {
        countMap.set(deptId, (countMap.get(deptId) ?? 0) + 1);
      }
    }

    return Array.from(countMap.entries()).map(([deptId, count]) => ({
      departmentId: deptId,
      departmentName: departmentMap.get(deptId) ?? 'Unknown',
      feedbackCount: count,
    }));
  }

  async getDisengagedUsers(companyId: number) {
    // Get all users in the company
    const users = await this.prisma.user_details.findMany({
      where: {
        company_id: companyId,
      },
      select: {
        user_id: true,
        name: true,
        profile_blob_id: true,
        designation: {
          select: {
            title: true,
          },
        },
      },
    });

    // Get all sender_ids and receiver_ids
    const [senders, receivers] = await Promise.all([
      this.prisma.feedback.findMany({
        where: {
          sender_id: {
            not: null,
          },
        },
        select: {
          sender_id: true,
        },
        distinct: ['sender_id'],
      }),
      this.prisma.feedback.findMany({
        where: {
          receiver_id: {
            not: null,
          },
        },
        select: {
          receiver_id: true,
        },
        distinct: ['receiver_id'],
      }),
    ]);

    const engagedUserIds = new Set<number>();
    senders.forEach((s) => engagedUserIds.add(s.sender_id!));
    receivers.forEach((r) => engagedUserIds.add(r.receiver_id!));

    // Filter users not in either list
    const disengaged = users.filter((u) => !engagedUserIds.has(u.user_id));

    return {
      count: disengaged.length,
      users: disengaged.map((u) => ({
        userId: u.user_id,
        name: u.name,
        designation: u.designation?.title ?? null,
        profileImageUrl: u.profile_blob_id
          ? `/blob/${u.profile_blob_id}/view`
          : null,
      })),
    };
  }

  async getAnonymousFeedbackCount(companyId: number) {
    const count = await this.prisma.feedback.count({
      where: {
        is_anonymous: true,
        sender: {
          company_id: companyId,
        },
      },
    });

    return { anonymous_feedback: count };
  }
  async getUsersNeverReceivedFeedback(companyId: number) {
    const users = await this.prisma.user_details.findMany({
      where: {
        company_id: companyId,
        feedback_received: {
          none: {},
        },
      },
      select: {
        user_id: true,
        name: true,
        profile_blob_id: true,
        designation: {
          select: {
            title: true,
          },
        },
      },
    });

    return {
      never_received_fb: users.length,
      // users: users.map((u) => ({
      //   userId: u.user_id,
      //   name: u.name,
      //   designation: u.designation?.title ?? null,
      //   profileImageUrl: u.profile_blob_id
      //     ? `/blob/${u.profile_blob_id}/view`
      //     : null,
      // })),
    };
  }

  async getUsersNeverGivenFeedback(companyId: number) {
    const users = await this.prisma.user_details.findMany({
      where: {
        company_id: companyId,
        feedback_given: {
          none: {},
        },
      },
      select: {
        user_id: true,
        name: true,
        profile_blob_id: true,
        designation: {
          select: {
            title: true,
          },
        },
      },
    });

    return {
      never_given_fb: users.length,
      // users: users.map((u) => ({
      //   userId: u.user_id,
      //   name: u.name,
      //   designation: u.designation?.title ?? null,
      //   profileImageUrl: u.profile_blob_id
      //     ? `/blob/${u.profile_blob_id}/view`
      //     : null,
      // })),
    };
  }
  async getTopReceiversThisMonth(companyId: number) {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const grouped = await this.prisma.feedback.groupBy({
      by: ['receiver_id'],
      where: {
        date: {
          gte: start,
          lte: end,
        },
        receiver: {
          company_id: companyId,
        },
      },
      _count: {
        receiver_id: true,
      },
      having: {
        receiver_id: {
          _count: {
            gt: 10,
          },
        },
      },
    });

    return { top_receivers: grouped.length };
  }

  async getNegativeSentimentCount(companyId: number) {
    const count = await this.prisma.feedback.count({
      where: {
        sentiment: 'NEGATIVE',
        receiver: {
          company_id: companyId,
        },
      },
    });

    return { negative_sentiment_count: count };
  }

  async getFeedbacksReceivedThisWeek(companyId: number) {
    const now = new Date();
    const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(now, { weekStartsOn: 1 });

    const count = await this.prisma.feedback.count({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        receiver: {
          company_id: companyId,
        },
      },
    });

    return { received_weekly: count };
  }
}
