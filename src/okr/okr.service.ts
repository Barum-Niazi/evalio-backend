import { Injectable } from '@nestjs/common';
import { OkrRepository } from './okr.repository';
import { CreateOkrDto, UpdateOkrDto } from './dto/okr.dto';
import { TagService } from 'src/tags/tag.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class OkrService {
  constructor(
    private readonly okrRepository: OkrRepository,
    private readonly tagService: TagService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateOkrDto) {
    const okr = await this.okrRepository.create(dto);
    const assignedTo =
      dto.assignedTo?.map((userId) => ({
        userId: userId,
      })) ?? [];
    this.tagService.createTagforEntities(okr.title, okr.description, okr.id);
    for (const user of assignedTo) {
      this.notificationService.create(
        user.userId,
        1,
        `You have been assigned a new OKR: ${okr.title}`,
      );
    }
    this.notificationService.create(
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
}
