import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

import { SETTINGS } from "../../../../settings";
import { PostsService } from "../application/posts.service";
import { PostsQueryRepository } from "../infrastructure/query/posts.query-repository";
import { CreateCommentByPostIdInputDto } from "./input-dto/posts.input-dto";
import { PaginatedViewDto } from "../../../../core/dto/base.paginated.view-dto";
import { GetPostsQueryParams } from "./input-dto/get-posts-query-params.input-dto";
import { CommentsService } from "../../comments/application/comments.service";
import { CommentsQueryRepository } from "../../comments/infrastructure/query/comments.query-repository";
import { GetCommentsQueryParams } from "../../comments/api/input-dto/get-comments-query-params.input-dto";
import { JwtAuthGuard } from "../../../user-accounts/guards/bearer/jwt-auth.guard";
import { ExtractUserFromRequest } from "../../../user-accounts/guards/decorators/param/extract-user-from-request.decorator";
import { UserContextDto } from "../../../user-accounts/guards/dto/user-context.dto";
import { UpdateLikeStatusInputDto } from "../../comments/api/input-dto/update-like-status.input-dto";
import { JwtOptionalAuthGuard } from "../../../user-accounts/guards/bearer/jwt-optional-auth.guard";
import { ExtractUserIfExistsFromRequest } from "../../../user-accounts/guards/decorators/param/extract-user-if-exists-from-request.decorator";
import { PostViewDtoPg } from "./view-dto/posts.view-dto.pg";
import { CommentViewDtoPg } from "../../comments/api/view-dto/comments.view-dto.pg";

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
  async getAllPosts(
    @Query() query: GetPostsQueryParams,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<PostViewDtoPg[]>> {
    const paginatedPosts = await this.postsQueryRepository.getAll_pg({
      requestParams: query,
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

  @ApiBearerAuth()
  @UseGuards(JwtOptionalAuthGuard)
  @Get(":postId")
  async getPostById(
    @Param("postId") postId: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PostViewDtoPg> {
    return this.postsService.getPostById_pg({
      postId,
      userId: user?.id || null,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(":id/comments")
  async createCommentByPostId(
    @Param("id") id: string,
    @Body() body: CreateCommentByPostIdInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<CommentViewDtoPg> {
    await this.postsQueryRepository.getByIdOrNotFoundFail_pg(id);

    const commentId = await this.commentsService.createComment_pg({
      content: body.content,
      postId: id,
      userId: user.id,
    });

    return this.commentsService.getCommentById_pg({
      commentId,
      userId: null,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtOptionalAuthGuard)
  @Get(":id/comments")
  async getCommentsByPostId(
    @Query() query: GetCommentsQueryParams,
    @Param("id") id: string,
    @ExtractUserIfExistsFromRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<CommentViewDtoPg[]>> {
    await this.postsQueryRepository.getByIdOrNotFoundFail_pg(id);

    const paginatedComments = await this.commentsQueryRepository.getAll_pg({
      requestParams: query,
      postId: id,
    });

    const commentsWithLikesInfo =
      await this.commentsService.getCommentsLikeInfo_pg({
        comments: paginatedComments.items,
        userId: user?.id || null,
      });

    return {
      ...paginatedComments,
      items: commentsWithLikesInfo,
    };
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
    return this.postsService.updatePostLikeStatus_pg({
      userId: user.id,
      postId,
      newLikeStatus: body.likeStatus,
    });
  }
}
