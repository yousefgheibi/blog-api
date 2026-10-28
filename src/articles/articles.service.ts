import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { FindArticlesQueryDto } from './dto/find-articles-query.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(query: FindArticlesQueryDto) {
    const { search, page, limit } = query;

    const cacheKey = `articles:list:page:${page}:limit:${limit}:search:${search}`;
    const cached = await this.cacheService.get<{
      data: Awaited<any>;
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(cacheKey);

    if (cached !== null) {
      return cached;
    }

    const where = {
      published: true,
      ...(search && {
        title: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
    ]);

    const result = {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.cacheService.set(cacheKey, result, 60);

    return result;
  }

  async findOne(id: number, userId?: number) {
    const cacheKey = `articles:detail:${id}`;

    const cached = await this.cacheService.get<{
      id: number;
      title: string;
      content: string;
      published: boolean;
      createdAt: Date;
      updatedAt: Date;
      authorId: number | null;
    }>(cacheKey);

    if (cached !== null) {
      return cached;
    }

    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (!article.published && article.authorId !== userId) {
      throw new NotFoundException('Article not found');
    }

    if (article.published) {
      await this.cacheService.set(cacheKey, article, 60);
    }

    return article;
  }

  async create(dto: CreateArticleDto, authorId: number) {
    const article = await this.prisma.article.create({
      data: {
        ...dto,
        authorId,
      },
    });

    await this.invalidateArticleCaches();
    return article;
  }

  async update(id: number, dto: UpdateArticleDto, authorId: number) {
    try {
      const article = await this.prisma.article.update({
        where: { id, authorId },
        data: dto,
      });

      await this.invalidateArticleCaches();
      return article;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Article not found');
      }

      throw error;
    }
  }

  async remove(id: number, authorId: number) {
    try {
      await this.prisma.article.delete({
        where: { id, authorId },
      });

      await this.invalidateArticleCaches();
      return { message: 'Article deleted successfully' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Article not found');
      }

      throw error;
    }
  }

  private async invalidateArticleCaches(): Promise<void> {
    await this.cacheService.deleteByPattern('articles:*');
  }
}
