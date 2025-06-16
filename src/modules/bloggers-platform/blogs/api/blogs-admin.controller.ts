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
import { ApiBasicAuth, ApiParam } from "@nestjs/swagger";

import { CreateBlogInputDto } from "./input-dto/blogs.input-dto";
import { UpdateBlogInputDto } from "./input-dto/update-blog.input-dto";
import { PaginatedViewDto } from "../../../../core/dto/base.paginated.view-dto";
import { GetBlogsQueryParams } from "./input-dto/get-blogs-query-params.input-dto";
import { GetPostsQueryParams } from "../../posts/api/input-dto/get-posts-query-params.input-dto";

import { BlogsService } from "../application/blogs.service";
import { PostsService } from "../../posts/application/posts.service";
import { BlogsQueryRepository } from "../infrastructure/query/blogs.query-repository";
import { PostsQueryRepository } from "../../posts/infrastructure/query/posts.query-repository";

import { SETTINGS } from "../../../../settings";
import { BlogViewDtoPg } from "./view-dto/blogs.view-dto.pg";
import { PostViewDtoPg } from "../../posts/api/view-dto/posts.view-dto.pg";
import { UpdatePostByBlogInputDto } from "./input-dto/update-post-by-blog.input-dto";
import { BasicAuthGuard } from "../../../user-accounts/guards/basic/basic-auth.guard";
import { CreatePostByBlogIdInputDto } from "./input-dto/create-post-by-blog-id.input-dto";

@Controller(SETTINGS.PATH.BLOGS_ADMIN)
@UseGuards(BasicAuthGuard)
@ApiBasicAuth("basicAuth")
export class BlogsAdminController {
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

  @Post()
  async createBlog(@Body() body: CreateBlogInputDto): Promise<BlogViewDtoPg> {
    const blogId = await this.blogsService.createBlog(body);

    return this.blogsQueryRepository.getByIdOrNotFoundFail_pg(blogId);
  }

  @Put(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateBlog(
    @Param("id") id: string,
    @Body() body: UpdateBlogInputDto,
  ): Promise<void> {
    return this.blogsService.updateBlog({ id, dto: body });
  }

  @ApiParam({ name: "id" })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBlog(@Param("id") id: string): Promise<void> {
    return this.blogsService.deleteBlog(id);
  }

  @Post(":id/posts")
  async createPostsByBlogId(
    @Param("id") id: string,
    @Body() body: CreatePostByBlogIdInputDto,
  ): Promise<PostViewDtoPg> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail_pg(id);

    const postId = await this.postsService.createPost_pg({ ...body, blogId: id });

    return this.postsQueryRepository.getByIdOrNotFoundFail_pg(postId);
  }

  @Get(":id/posts")
  async getPostsByBlogId(
    @Query() query: GetPostsQueryParams,
    @Param("id") id: string,
  ): Promise<PaginatedViewDto<PostViewDtoPg[]>> {
    await this.blogsQueryRepository.getByIdOrNotFoundFail_pg(id);

    return this.postsQueryRepository.getAll_pg({
      requestParams: query,
      blogId: id,
    });
  }

  @Put(":blogId/posts/:postId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePostByBlogId(
    @Param("blogId") blogId: string,
    @Param("postId") postId: string,
    @Body() body: UpdatePostByBlogInputDto,
  ): Promise<void> {
    return this.postsService.updatePost_pg({
      id: postId,
      dto: {
        ...body,
        blogId,
      },
    });
  }

  @Delete(":blogId/posts/:postId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePostByBlogId(
    @Param("blogId") blogId: string,
    @Param("postId") postId: string,
  ): Promise<void> {
    return this.postsService.deletePost_pg({
      postId,
      blogId,
    });
  }
}
