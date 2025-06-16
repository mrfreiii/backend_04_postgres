import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBasicAuth, ApiBearerAuth, ApiParam } from "@nestjs/swagger";

import { BlogViewDto } from "./view-dto/blogs.view-dto";
import { CreateBlogInputDto } from "./input-dto/blogs.input-dto";
import { PostViewDto } from "../../posts/api/view-dto/posts.view-dto";
import { UpdateBlogInputDto } from "./input-dto/update-blog.input-dto";
import { PaginatedViewDto } from "../../../../core/dto/base.paginated.view-dto";
import { GetBlogsQueryParams } from "./input-dto/get-blogs-query-params.input-dto";
import { GetPostsQueryParams } from "../../posts/api/input-dto/get-posts-query-params.input-dto";

import { BlogsService } from "../application/blogs.service";
import { PostsService } from "../../posts/application/posts.service";
import { BlogsQueryRepository } from "../infrastructure/query/blogs.query-repository";
import { PostsQueryRepository } from "../../posts/infrastructure/query/posts.query-repository";

import { SETTINGS } from "../../../../settings";
import { Public } from "../../../user-accounts/guards/decorators/public.decorator";
import { BasicAuthGuard } from "../../../user-accounts/guards/basic/basic-auth.guard";
import { JwtOptionalAuthGuard } from "../../../user-accounts/guards/bearer/jwt-optional-auth.guard";
import { ExtractUserIfExistsFromRequest } from "../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator";
import { UserContextDto } from "../../../user-accounts/guards/dto/user-context.dto";
import { CreatePostByBlogIdInputDto } from "./input-dto/create-post-by-blog-id.input-dto";
import { BlogViewDtoPg } from "./view-dto/blogs.view-dto.pg";
import { PostViewDtoPg } from "../../posts/api/view-dto/posts.view-dto.pg";
import { UpdatePostByBlogInputDto } from "./input-dto/update-post-by-blog.input-dto";

@Controller(SETTINGS.PATH.BLOGS_PUBLIC)
export class BlogsPublicController {
  constructor(
    private blogsQueryRepository: BlogsQueryRepository,
    private blogsService: BlogsService,
    private postsService: PostsService,
    private postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getAllBlogs(
    @Query() query: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDtoPg[]>> {
    return this.blogsQueryRepository.getAll_pg(query);
  }
  
  @UseGuards(JwtOptionalAuthGuard)
  @Get(":id/posts")
  async getPostsByBlogId(
    @Query() query: GetPostsQueryParams,
    @Param("id") id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<PostViewDtoPg[]>> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail_pg(id);

    const paginatedPosts = await this.postsQueryRepository.getAll_pg({
      requestParams: query,
      blogId: id,
    });

    const postsWithLikesInfo = await this.postsService.getPostsLikeInfo_pg({
      posts: paginatedPosts.items,
      userId: user?.id || null,
    });

    return {
      ...paginatedPosts,
      items: postsWithLikesInfo,
    };
  }

  @Get(":id")
  async getBlogById(@Param("id") id: string): Promise<BlogViewDtoPg> {
    return this.blogsQueryRepository.getByIdOrNotFoundFail_pg(id);
  }
}
