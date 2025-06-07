import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { CreateCommentDto } from "../dto/comment.dto";
import { Comment, CommentModelType } from "../domain/comment.entity";
import { CommentsRepository } from "../infrastructure/comments.repository";
import { UsersExternalQueryRepository } from "../../../user-accounts/users/infrastructure/external-query/users.external-query-repository";
import { UpdateCommentInputDto } from "../api/input-dto/update-comment.input-dto";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";
import { LikeStatusEnum } from "../../likes/enums/likes.enum";
import { LikesService } from "../../likes/application/likes.service";
import { CommentViewDto } from "../api/view-dto/comments.view-dto";
import { GetCommentInputDto } from "./dto/get-comment.input-dto";
import { LikesRepository } from "../../likes/infrastructure/likes.repository";
import { GetCommentsLikesStatusesDto } from "./dto/get-comments-like-statuses.dto";

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
    private commentsRepository: CommentsRepository,
    private usersExternalQueryRepository: UsersExternalQueryRepository,
    private likesService: LikesService,
    private likesRepository: LikesRepository,
  ) {}

  async getCommentById(dto: GetCommentInputDto): Promise<CommentViewDto> {
    const { commentId, userId } = dto;

    const comment =
      await this.commentsRepository.getByIdOrNotFoundFail(commentId);

    if (userId) {
      const userLikeStatus =
        await this.likesRepository.getLikeByUserIdAndEntityId({
          userId,
          entityId: commentId,
        });

      comment.likesInfo.myStatus =
        userLikeStatus?.status ?? LikeStatusEnum.None;
    }

    return CommentViewDto.mapToView(comment);
  }

  async createComment(dto: CreateCommentDto): Promise<string> {
    const user = await this.usersExternalQueryRepository.getByIdOrNotFoundFail(
      dto.userId,
    );

    const comment = this.CommentModel.createInstance({
      postId: dto.postId,
      content: dto.content,
      commentatorInfo: {
        userId: dto.userId,
        userLogin: user?.login,
      },
    });

    await this.commentsRepository.save(comment);

    return comment._id.toString();
  }

  async updateComment({
    userId,
    commentId,
    dto,
  }: {
    userId: string;
    commentId: string;
    dto: UpdateCommentInputDto;
  }): Promise<void> {
    const comment =
      await this.commentsRepository.getByIdOrNotFoundFail(commentId);

    if (comment.commentatorInfo.userId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: "Forbidden to edit another user's comment",
        extensions: [
          {
            field: "",
            message: "Forbidden to edit another user's comment",
          },
        ],
      });
    }

    comment.updateContent(dto.content);

    await this.commentsRepository.save(comment);
  }

  async deleteComment({
    userId,
    commentId,
  }: {
    userId: string;
    commentId: string;
  }): Promise<void> {
    const comment =
      await this.commentsRepository.getByIdOrNotFoundFail(commentId);

    if (comment.commentatorInfo.userId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: "Forbidden to delete another user's comment",
        extensions: [
          {
            field: "",
            message: "Forbidden to delete another user's comment",
          },
        ],
      });
    }

    comment.makeDeleted();

    await this.commentsRepository.save(comment);
  }

  async updateCommentLikeStatus(dto: {
    userId: string;
    commentId: string;
    newLikeStatus: LikeStatusEnum;
  }): Promise<void> {
    const { userId, commentId, newLikeStatus } = dto;

    const comment =
      await this.commentsRepository.getByIdOrNotFoundFail(commentId);

    const newLikesAndDislikesCounts = await this.likesService.updateLike({
      userId,
      newLikeStatus,
      entityId: commentId,
      currentLikesCount: comment.likesInfo?.likesCount || 0,
      currentDislikesCount: comment.likesInfo?.dislikesCount || 0,
    });

    comment.updateLikes({
      likesCount: newLikesAndDislikesCounts.newLikesCount,
      dislikesCount: newLikesAndDislikesCounts.newDislikesCount,
    });

    await this.commentsRepository.save(comment);
  }

  async getLikeStatusesForComments(
    dto: GetCommentsLikesStatusesDto,
  ): Promise<CommentViewDto[]> {
    const { comments, userId } = dto;

    const userLikeStatuses = await this.likesRepository.getLikesForEntities({
      userId: userId!,
      entitiesIds: comments.map((comment) => comment.id),
    });

    return comments.map((comment) => {
      const userLikeStatus =
        userLikeStatuses.find(
          (status) =>
            status.userId === userId && status.entityId === comment.id,
        )?.status || LikeStatusEnum.None;

      return {
        ...comment,
        likesInfo: {
          ...comment.likesInfo,
          myStatus: userLikeStatus,
        },
      };
    });
  }
}
