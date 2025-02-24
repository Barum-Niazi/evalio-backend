import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new tag
  async createTag(name: string, description?: string) {
    return this.prisma.tags.create({ data: { name, description } });
  }

  // Find tag by name
  async findTagByName(name: string) {
    return this.prisma.tags.findFirst({ where: { name } });
  }

  // Get all tags
  async getAllTags() {
    return this.prisma.tags.findMany();
  }

  // Associate tags with an entity (supports references)
  async tagEntity(
    entityId: number,
    entityType: string,
    tagIds: number[],
    referenceId?: number,
    referenceType?: string,
  ) {
    return this.prisma.tagged_entities.createMany({
      data: tagIds.map((tagId) => ({
        tag_id: tagId,
        entity_id: entityId,
        entity_type: entityType,
        reference_id: referenceId ?? null, // Store reference if provided
        reference_type: referenceType ?? null, // Store reference type
      })),
    });
  }

  // Remove specific tags from an entity
  async untagEntity(entityId: number, entityType: string, tagIds: number[]) {
    return this.prisma.tagged_entities.deleteMany({
      where: {
        entity_id: entityId,
        entity_type: entityType,
        tag_id: { in: tagIds },
      },
    });
  }

  // Get all tags linked to an entity
  async getTagsForEntity(entityId: number, entityType: string) {
    return this.prisma.tagged_entities.findMany({
      where: { entity_id: entityId, entity_type: entityType },
      include: { tag: true },
    });
  }

  // Get all entities associated with a specific tag
  async getEntitiesByTag(tagId: number) {
    return this.prisma.tagged_entities.findMany({
      where: { tag_id: tagId },
      include: { tag: true }, // Fetch related tag details
    });
  }
}
