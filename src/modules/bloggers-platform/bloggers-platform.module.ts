import { Module } from "@nestjs/common";

import { UserAccountsModule } from "../user-accounts/user-accounts.module";

import { BlogEntity } from "./blogs/domain/blog.entity.pg";
import { BlogsService } from "./blogs/application/blogs.service";
import { BlogsAdminController } from "./blogs/api/blogs-admin.controller";
import { BlogsPublicController } from "./blogs/api/blogs-public.controller";
import { BlogsRepository } from "./blogs/infrastructure/blogs.repository";
import { BlogsQueryRepository } from "./blogs/infrastructure/query/blogs.query-repository";

import { PostEntity } from "./posts/domain/post.entity.pg";
import { PostsController } from "./posts/api/posts.controller";
import { PostsService } from "./posts/application/posts.service";
import { PostsRepository } from "./posts/infrastructure/posts.repository";
import { PostsQueryRepository } from "./posts/infrastructure/query/posts.query-repository";

import { CommentEntity } from "./comments/domain/comment.entity.pg";
import { CommentsController } from "./comments/api/comments.controller";
import { CommentsService } from "./comments/application/comments.service";
import { CommentsRepository } from "./comments/infrastructure/comments.repository";
import { CommentsQueryRepository } from "./comments/infrastructure/query/comments.query-repository";

const controllers = [
  BlogsAdminController,
  BlogsPublicController,
  PostsController,
  CommentsController,
];

const services = [BlogsService, PostsService, CommentsService];

const repos = [
  BlogsRepository,
  BlogsQueryRepository,
  PostsRepository,
  PostsQueryRepository,
  CommentsRepository,
  CommentsQueryRepository,
];

const entities = [BlogEntity, PostEntity, CommentEntity];

@Module({
  imports: [UserAccountsModule],
  controllers: [...controllers],
  providers: [...services, ...repos, ...entities],
  exports: [],
})
export class BloggersPlatformModule {}
