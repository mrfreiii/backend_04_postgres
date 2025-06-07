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

import { SETTINGS } from "../../../../settings";
import { PostsService } from "../application/posts.service";
import { PostsQueryRepository } from "../infrastructure/query/posts.query-repository";
import { PostViewDto } from "./view-dto/posts.view-dto";
import {
  CreateCommentByPostIdInputDto,
  CreatePostInputDto,
} from "./input-dto/posts.input-dto";
import { UpdatePostInputDto } from "./input-dto/update-post.input-dto";
import { PaginatedViewDto } from "../../../../core/dto/base.paginated.view-dto";
import { GetPostsQueryParams } from "./input-dto/get-posts-query-params.input-dto";
import { CommentViewDto } from "../../comments/api/view-dto/comments.view-dto";
import { CommentsService } from "../../comments/application/comments.service";
import { CommentsQueryRepository } from "../../comments/infrastructure/query/comments.query-repository";
import { GetCommentsQueryParams } from "../../comments/api/input-dto/get-comments-query-params.input-dto";
import { BasicAuthGuard } from "../../../user-accounts/guards/basic/basic-auth.guard";
import { JwtAuthGuard } from "../../../user-accounts/guards/bearer/jwt-auth.guard";
import { ExtractUserFromRequest } from "../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator";
import { UserContextDto } from "../../../user-accounts/guards/dto/user-context.dto";
import { UpdateLikeStatusInputDto } from "../../comments/api/input-dto/update-like-status.input-dto";
import { JwtOptionalAuthGuard } from "../../../user-accounts/guards/bearer/jwt-optional-auth.guard";
import { ExtractUserIfExistsFromRequest } from "../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator";

@Controller(SETTINGS.PATH.POSTS)
export class PostsController {
  constructor(
    private postsQueryRepository: PostsQueryRepository,
    private commentsQueryRepository: CommentsQueryRepository,
    private postsService: PostsService,
    private commentsService: CommentsService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtOptionalAuthGuard)
  @Get()
  async getAll(
    @Query() query: GetPostsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<PostViewDto[]>> {
    const allPosts = await this.postsQueryRepository.getAll({
      query,
    });

    if (user?.id) {
      allPosts.items = await this.postsService.getLikeStatusesForPosts({
        userId: user.id,
        posts: allPosts.items,
      });
    }

    return allPosts;
  }

  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth("basicAuth")
  @Post()
  async createPost(@Body() body: CreatePostInputDto): Promise<PostViewDto> {
    const postId = await this.postsService.createPost(body);

    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtOptionalAuthGuard)
  @ApiParam({ name: "id" })
  @Get(":postId")
  async getById(
    @Param("postId") postId: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PostViewDto> {
    return this.postsService.getPostById({
      postId,
      userId: user?.id || null,
    });
  }

  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth("basicAuth")
  @Put(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param("id") id: string,
    @Body() body: UpdatePostInputDto,
  ): Promise<PostViewDto> {
    const postId = await this.postsService.updatePost({ id, dto: body });

    return this.postsQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth("basicAuth")
  @ApiParam({ name: "id" })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(@Param("id") id: string): Promise<void> {
    return this.postsService.deletePost(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/comments")
  async createCommentByPostId(
    @Param("id") id: string,
    @Body() body: CreateCommentByPostIdInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<CommentViewDto> {
    await this.postsQueryRepository.getByIdOrNotFoundFail(id);

    const commentId = await this.commentsService.createComment({
      content: body.content,
      postId: id,
      userId: user.id,
    });

    return this.commentsQueryRepository.getByIdOrNotFoundFail(commentId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtOptionalAuthGuard)
  @Get(":id/comments")
  async getCommentsByPostId(
    @Query() query: GetCommentsQueryParams,
    @Param("id") id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<CommentViewDto[]>> {
    await this.postsQueryRepository.getByIdOrNotFoundFail(id);

    const allComments = await this.commentsQueryRepository.getAll({
      query,
      postId: id,
    });

    if (user?.id) {
      allComments.items = await this.commentsService.getLikeStatusesForComments(
        {
          userId: user.id,
          comments: allComments.items,
        },
      );
    }

    return allComments;
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(":postId/like-status")
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePostLikeStatus(
    @Param("postId") postId: string,
    @Body() body: UpdateLikeStatusInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    return this.postsService.updatePostLikeStatus({
      userId: user.id,
      postId,
      newLikeStatus: body.likeStatus,
    });
  }
}
