import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { FindArticlesQueryDto } from './dto/find-articles-query.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import type { Request } from 'express';

@Controller('articles')
export class ArticlesController {
  constructor(private articlesService: ArticlesService) {}

  @Get()
  findAll(@Query() query: FindArticlesQueryDto) {
    return this.articlesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number,  @Req() req: Request) {
    const user = req.user as { userId: number; email: string; role: string };
    const article = this.articlesService.findOne(id, user.userId);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createArticleDto: CreateArticleDto, @Req() req: Request) {
    const user = req.user as { userId: number; email: string; role: string };
    return this.articlesService.create(createArticleDto, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
    @Req() req: Request,
  ) {
    const user = req.user as { userId: number; email: string; role: string };
    return this.articlesService.update(id, updateArticleDto, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as { userId: number; email: string; role: string };
    return this.articlesService.remove(id, user.userId);
  }
}
