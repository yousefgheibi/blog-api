import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    example: 'Getting Started with NestJS',
    description: 'Article title',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: 'This article explains the fundamentals of NestJS...',
    description: 'Article content',
    minLength: 10,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  content: string;
}