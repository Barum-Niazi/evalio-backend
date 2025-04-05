import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { tags, tagged_entities } from '@prisma/client';

@Injectable()
export class TagRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTag(name: string, description?: string): Promise<tags> {
    return this.prisma.tags.create({
      data: {
        name,
        description,
        audit: {}, // Default empty audit field as per schema
      },
    });
  }

  async createTagforEntities(
    name: string,
    description?: string,
    parentId?: number,
  ): Promise<tags> {
    return this.prisma.tags.create({
      data: {
        name,
        description,
        parent_entity_id: parentId || null,
        audit: {}, // Default empty audit field as per schema
      },
    });
  }

  async findTagByName(name: string): Promise<tags | null> {
    return this.prisma.tags.findUnique({
      where: { name },
    });
  }

  /**
   * ✅ Link an entity to an existing tag (auto-tagging an entity).
   */
  async linkTagToEntity(
    tagId: number,
    entityId: number,
    entityType: string,
    referenceId?: number,
    referenceType?: string,
  ): Promise<tagged_entities> {
    return this.prisma.tagged_entities.create({
      data: {
        tag_id: tagId,
        entity_id: entityId,
        entity_type: entityType,
        reference_id: referenceId || null,
        reference_type: referenceType || null,
        audit: {},
      },
    });
  }

  /**
   * ✅ Link multiple existing tags to an entity.
   */
  async tagEntityWithTags(
    tagIds: number[],
    entityId: number,
    entityType: string,
    referenceId?: number,
    referenceType?: string,
  ): Promise<tagged_entities[]> {
    const tagLinks = tagIds.map((tagId) => ({
      tag_id: tagId,
      entity_id: entityId,
      entity_type: entityType,
      reference_id: referenceId || null,
      reference_type: referenceType || null,
      audit: {},
    }));

    return this.prisma.tagged_entities.createMany({
      data: tagLinks,
      skipDuplicates: true, // Prevent duplicate links
    }) as unknown as tagged_entities[];
  }

  /**
   * ✅ Remove tags from an entity.
   */
  async untagEntity(
    tagIds: number[],
    entityId: number,
    entityType: string,
  ): Promise<void> {
    await this.prisma.tagged_entities.deleteMany({
      where: {
        tag_id: { in: tagIds },
        entity_id: entityId,
        entity_type: entityType,
      },
    });
  }

  /**
   * ✅ Fetch all tags associated with a specific entity.
   */
  async getTagsForEntity(
    entityId: number,
    entityType: string,
  ): Promise<tags[]> {
    return this.prisma.tags.findMany({
      where: {
        tagged_entities: {
          some: {
            entity_id: entityId,
            entity_type: entityType,
          },
        },
      },
    });
  }

  /**
   * ✅ Fetch all tags in the system.
   */
  async getAllTags(): Promise<tags[]> {
    return this.prisma.tags.findMany();
  }
}
