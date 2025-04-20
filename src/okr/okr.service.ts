import { Injectable } from '@nestjs/common';
import { OkrRepository } from './okr.repository';
import { CreateOkrDto, UpdateOkrDto } from './dto/okr.dto';
import { TagService } from 'src/tags/tag.service';
import { NotificationService } from 'src/notification/notification.service';
import { DepartmentRepository } from 'src/department/department.repository';

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
    if (dto.departmentId) {
      const employees =
        await this.departmentRepository.getEmployeesByDepartment(
          dto.departmentId,
        );
      departmentUserIds = employees.map((emp) => emp.user_id);
    }

    const allAssignees = Array.from(
      new Set([...(dto.assignedTo ?? []), ...departmentUserIds]),
    );

    const okr = await this.okrRepository.create({
      title: dto.title,
      description: dto.description,
      companyId: dto.companyId,
      userId: dto.userId,
      parentOkrId: dto.parentOkrId,
      departmentId: dto.departmentId,
      assignedTo: allAssignees,
    });

    await this.tagService.createTagforEntities(
      okr.title,
      okr.description,
      okr.id,
    );

    for (const userId of allAssignees) {
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

  findAll() {
    return this.okrRepository.findAll();
  }

  findOne(id: number) {
    return this.okrRepository.findOne(id);
  }

  async update(id: number, dto: UpdateOkrDto, userId: number) {
    return this.okrRepository.update(id, dto, userId);
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
}
