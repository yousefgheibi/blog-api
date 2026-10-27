import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { FindArticlesQueryDto } from './dto/find-articles-query.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindArticlesQueryDto) {
    const { search, page, limit } = query;

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

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId?: number) {
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (!article.published && article.authorId !== userId) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async create(dto: CreateArticleDto, authorId: number) {
    return this.prisma.article.create({
      data: {
        ...dto,
        authorId,
      },
    });
  }

  async update(id: number, dto: UpdateArticleDto, authorId: number) {
    try {
      return await this.prisma.article.update({
        where: { id, authorId },
        data: dto,
      });
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
}
