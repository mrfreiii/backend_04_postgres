import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { UserAccountsModule } from "../user-accounts/user-accounts.module";

import { Blog, BlogSchema } from "./blogs/domain/blog.entity";
import { BlogsController } from "./blogs/api/blogs.controller";
import { BlogsService } from "./blogs/application/blogs.service";
import { BlogsRepository } from "./blogs/infrastructure/blogs.repository";
import { BlogsQueryRepository } from "./blogs/infrastructure/query/blogs.query-repository";
import { BlogsExternalQueryRepository } from "./blogs/infrastructure/external-query/blogs.external-query-repository";

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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Like.name, schema: LikeSchema },
    ]),
    UserAccountsModule,
  ],
  controllers: [BlogsController, PostsController, CommentsController],
  providers: [
    BlogsService,
    BlogsRepository,
    BlogsQueryRepository,
    BlogsExternalQueryRepository,
    PostsService,
    PostsRepository,
    PostsQueryRepository,
    CommentsService,
    CommentsRepository,
    CommentsQueryRepository,
    LikesService,
    LikesRepository,
    LikesQueryRepository,
  ],
  exports: [],
})
export class BloggersPlatformModule {}
