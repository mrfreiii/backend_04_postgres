import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { UserAccountsModule } from "../user-accounts/user-accounts.module";

import { BlogEntity } from "./blogs/domain/blog.entity.pg";
import { Blog, BlogSchema } from "./blogs/domain/blog.entity";
import { BlogsService } from "./blogs/application/blogs.service";
import { BlogsAdminController } from "./blogs/api/blogs-admin.controller";
import { BlogsPublicController } from "./blogs/api/blogs-public.controller";
import { BlogsRepository } from "./blogs/infrastructure/blogs.repository";
import { BlogsQueryRepository } from "./blogs/infrastructure/query/blogs.query-repository";
import { BlogsExternalQueryRepository } from "./blogs/infrastructure/external-query/blogs.external-query-repository";

import { PostEntity } from "./posts/domain/post.entity.pg";
import { Post, PostSchema } from "./posts/domain/post.entity";
import { PostsController } from "./posts/api/posts.controller";
import { PostsService } from "./posts/application/posts.service";
import { PostsRepository } from "./posts/infrastructure/posts.repository";
import { PostsQueryRepository } from "./posts/infrastructure/query/posts.query-repository";

import { CommentsController } from "./comments/api/comments.controller";
import { Comment, CommentSchema } from "./comments/domain/comment.entity";
import { CommentsService } from "./comments/application/comments.service";
import { CommentsRepository } from "./comments/infrastructure/comments.repository";
import { CommentsQueryRepository } from "./comments/infrastructure/query/comments.query-repository";

import { Like, LikeSchema } from "./likes/domain/like.entity";
import { LikesService } from "./likes/application/likes.service";
import { LikesRepository } from "./likes/infrastructure/likes.repository";
import { LikesQueryRepository } from "./likes/infrastructure/query/likes.query-repository";

const schemas = [
  { name: Blog.name, schema: BlogSchema },
  { name: Post.name, schema: PostSchema },
  { name: Comment.name, schema: CommentSchema },
  { name: Like.name, schema: LikeSchema },
];

const services = [BlogsService, PostsService, CommentsService, LikesService];

const repos = [
  BlogsRepository,
  BlogsQueryRepository,
  BlogsExternalQueryRepository,
  PostsRepository,
  PostsQueryRepository,
  CommentsRepository,
  CommentsQueryRepository,
  LikesRepository,
  LikesQueryRepository,
];

const entities = [BlogEntity, PostEntity];

@Module({
  imports: [MongooseModule.forFeature([...schemas]), UserAccountsModule],
  controllers: [BlogsAdminController, BlogsPublicController, PostsController, CommentsController],
  providers: [...services, ...repos, ...entities],
  exports: [],
})
export class BloggersPlatformModule {}
