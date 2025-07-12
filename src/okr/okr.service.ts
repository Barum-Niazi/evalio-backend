import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OkrRepository } from './okr.repository';
import { CreateOkrDto, UpdateOkrDto } from './dto/okr.dto';
import { TagService } from 'src/tags/tag.service';
import { NotificationService } from 'src/notification/notification.service';
import { DepartmentRepository } from 'src/department/department.repository';
import { calculateOkrProgress } from './okr,utils';
import { format } from 'date-fns';

@Injectable()
export class OkrService {
  constructor(
    private readonly okrRepository: OkrRepository,
    private readonly tagService: TagService,
    private readonly notificationService: NotificationService,
    private readonly departmentRepository: DepartmentRepository,
  ) {}

  async create(dto: CreateOkrDto) {
    let departmentUserIds: number[] = [];

    // Get department employees
    const okr = await this.okrRepository.create({
      title: dto.title,
      description: dto.description,
      companyId: dto.companyId,
      userId: dto.userId,
      dueDate: dto.dueDate,
      parentOkrId: dto.parentOkrId,
      departmentId: dto.departmentId,
      assignedTo: dto.assignedTo,
    });

    await this.tagService.createTagforEntities(
      okr.title,
      okr.description,
      okr.id,
      'OKR',
    );

    for (const userId of dto.assignedTo) {
      await this.notificationService.create(
        userId,
        1,
        `You have been assigned a new OKR: ${okr.title}`,
      );
    }

    await this.notificationService.create(
      dto.userId,
      1,
      `New OKR created: ${okr.title}`,
    );

    return okr;
  }
  async findAllForCompany(companyId: number) {
    return this.okrRepository.getAllByCompany(companyId);
  }

  findOne(id: number) {
    return this.okrRepository.findOne(id);
  }
  async update(
    id: number,
    dto: UpdateOkrDto,
    user: { id: number; role: string },
  ) {
    const okr = await this.okrRepository.findById(id);

    if (!okr) {
      throw new NotFoundException('OKR not found');
    }

    const isOwner = okr.user_id === user.id;
    const isAdmin = user.role.toUpperCase() === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not authorized to update this OKR');
    }

    return this.okrRepository.update(id, dto, user.id);
  }

  delete(id: number) {
    return this.okrRepository.delete(id);
  }

  getRootOkrs() {
    return this.okrRepository.getOkrsByParent(null);
  }

  getSubTree(parentId: number) {
    return this.okrRepository.getOkrsByParent(parentId);
  }

  async getByDepartment(departmentId: number) {
    return this.okrRepository.getByDepartment(departmentId);
  }

  async getByUser(userId: number) {
    return this.okrRepository.getByUser(userId);
  }

  async getProgressBreakdown(companyId: number) {
    const okrs = await this.okrRepository.getAllOkrsWithKeyResults(companyId);

    const stats = {
      completed: 0,
      inProgress: 0,
      notStarted: 0,
    };

    for (const okr of okrs) {
      const progress = calculateOkrProgress(okr.key_results);
      if (progress === 0) stats.notStarted++;
      else if (progress < 100) stats.inProgress++;
      else stats.completed++;
    }

    return stats;
  }

  async getOkrAchievementTrends(
    companyId: number,
    groupBy: 'day' | 'week' | 'month' | 'year',
  ) {
    const okrs =
      await this.okrRepository.getOkrsWithDueDatesAndDepartments(companyId);

    const trends: Record<
      string,
      Record<
        string,
        { completed: number; inProgress: number; notStarted: number }
      >
    > = {};

    for (const okr of okrs) {
      if (!okr.start_date || !okr.department) continue;

      const formatMap = {
        day: 'yyyy-MM-dd',
        week: "yyyy-'W'II",
        month: 'yyyy-MM',
        year: 'yyyy',
      };

      const key = format(okr.start_date, formatMap[groupBy]); // changed to start_date
      const deptName = okr.department.name;
      const progress = calculateOkrProgress(okr.key_results);

      if (!trends[key]) trends[key] = {};
      if (!trends[key][deptName]) {
        trends[key][deptName] = {
          completed: 0,
          inProgress: 0,
          notStarted: 0,
        };
      }

      if (progress === 0) trends[key][deptName].notStarted++;
      else if (progress < 100) trends[key][deptName].inProgress++;
      else trends[key][deptName].completed++;
    }

    return Object.entries(trends).map(([period, departments]) => ({
      period,
      departments,
    }));
  }

  async getUserOkrCount(companyId: number) {
    return this.okrRepository.getUserOkrCount(companyId);
  }

  async getAvgProgressPerOkr(companyId: number) {
    const okrsWithKRs =
      await this.okrRepository.getOkrsWithKeyResults(companyId);

    return okrsWithKRs.map((okr) => {
      const progress = calculateOkrProgress(okr.key_results);
      return {
        okrId: okr.id,
        title: okr.title,
        avgProgress: progress,
      };
    });
  }

  async getOkrCountByDepartment(companyId: number) {
    return this.okrRepository.getOkrCountByDepartment(companyId);
  }

  async getOkrsWithNoKeyResults(companyId: number) {
    return this.okrRepository.getOkrsWithNoKeyResults(companyId);
  }

  async getTopPerformers(companyId: number) {
    const userOkrs =
      await this.okrRepository.getUserOkrsWithKeyResults(companyId);

    const userProgressMap: Record<
      number,
      { name: string; progressList: number[]; profile_blob_id?: number }
    > = {};

    for (const record of userOkrs) {
      const progress = calculateOkrProgress(record.okr.key_results);
      if (!userProgressMap[record.user_id]) {
        userProgressMap[record.user_id] = {
          name: record.user.name,
          profile_blob_id: record.user.profile_blob_id ?? null,
          progressList: [],
        };
      }
      userProgressMap[record.user_id].progressList.push(progress);
    }

    const result = Object.entries(userProgressMap).map(([userId, data]) => {
      const avg =
        data.progressList.reduce((sum, p) => sum + p, 0) /
        data.progressList.length;
      return {
        userId: +userId,
        name: data.name,
        avgProgress: Math.round(avg),
        profileImageUrl: data.profile_blob_id
          ? `/blob/${data.profile_blob_id}/view`
          : null,
      };
    });

    return result.sort((a, b) => b.avgProgress - a.avgProgress).slice(0, 5);
  }

  async getOkrDueStatus(companyId: number) {
    return this.okrRepository.getOkrDueStatus(companyId);
  }
}
