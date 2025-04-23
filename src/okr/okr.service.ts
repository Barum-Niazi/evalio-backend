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
      'OKR',
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
}
