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

  // @Public()
  // @ApiParam({ name: "id" })
  // @Get(":id")
  // async getBlogById(@Param("id") id: string): Promise<BlogViewDto> {
  //   return this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  // }
  //
  // @ApiBearerAuth()
  // @UseGuards(JwtOptionalAuthGuard)
  // @Public()
  // @Get(":id/posts")
  // async getPostsByBlogId(
  //   @Query() query: GetPostsQueryParams,
  //   @Param("id") id: string,
  //   @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  // ): Promise<PaginatedViewDto<PostViewDto[]>> {
  //   await this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  //
  //   const allPosts = await this.postsQueryRepository.getAll({
  //     query,
  //     blogId: id,
  //   });
  //
  //   if (user?.id) {
  //     allPosts.items = await this.postsService.getLikeStatusesForPosts({
  //       userId: user.id,
  //       posts: allPosts.items,
  //     });
  //   }
  //
  //   return allPosts;
  // }
  //
  // @Post(":id/posts")
  // async createPostsByBlogId(
  //   @Param("id") id: string,
  //   @Body() body: CreatePostByBlogIdInputDto,
  // ): Promise<PostViewDto> {
  //   await this.blogsQueryRepository.getByIdOrNotFoundFail(id);
  //
  //   const postId = await this.postsService.createPost({ ...body, blogId: id });
  //
  //   return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  // }
}
