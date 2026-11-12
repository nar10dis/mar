import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import type { AuthUser } from '../auth/auth.types.js';
import { idParam } from '../admin/admin.schemas.js';
import { articleInputSchema } from './article-content.schema.js';
import type { ArticleInput } from './article-content.schema.js';
import { ArticlesService } from './articles.service.js';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  /** ?before=<id> : page suivante du fil */
  @Public()
  @Get()
  list(@Query('before', { schema: idParam.optional() }) before?: number) {
    return this.articles.list(before);
  }

  @Public()
  @Get(':id')
  get(@Param('id', { schema: idParam }) id: number) {
    return this.articles.get(id);
  }

  /** Publication immédiate, sans validation (cf. roadmap). */
  @Can.Anyone()
  @Post()
  create(@CurrentUser() user: AuthUser, @Body({ schema: articleInputSchema }) body: ArticleInput) {
    return this.articles.create(user, body);
  }

  @Can.Anyone()
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', { schema: idParam }) id: number,
    @Body({ schema: articleInputSchema }) body: ArticleInput,
  ) {
    return this.articles.update(user, id, body);
  }

  @Can.Anyone()
  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', { schema: idParam }) id: number) {
    return this.articles.remove(user, id);
  }
}
