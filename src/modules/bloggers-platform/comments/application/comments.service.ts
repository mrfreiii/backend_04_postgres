import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { CreateCommentDto } from "../dto/comment.dto";
import { Comment, CommentModelType } from "../domain/comment.entity";
import { CommentsRepository } from "../infrastructure/comments.repository";
import { UsersExternalQueryRepository } from "../../../user-accounts/users/infrastructure/external-query/users.external-query-repository";
import { UpdateCommentInputDto } from "../api/input-dto/update-comment.input-dto";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";
import {
  LikeStatusEnum,
  mapEnumLikeStatusToBdStatus
} from "../../likes/enums/likes.enum";
import { LikesService } from "../../likes/application/likes.service";
import { CommentViewDto } from "../api/view-dto/comments.view-dto";
import { GetCommentInputDto } from "./dto/get-comment.input-dto";
import { LikesRepository } from "../../likes/infrastructure/likes.repository";
import { GetCommentsLikesStatusesDto } from "./dto/get-comments-like-statuses.dto";
import { CommentEntity } from "../domain/comment.entity.pg";
import { CommentViewDtoPg } from "../api/view-dto/comments.view-dto.pg";
import { PostViewDtoPg } from "../../posts/api/view-dto/posts.view-dto.pg";

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
    private commentsRepository: CommentsRepository,
    private usersExternalQueryRepository: UsersExternalQueryRepository,
    private likesService: LikesService,
    private likesRepository: LikesRepository,
    private postRepository: LikesRepository,
    private commentEntity: CommentEntity,
  ) {}

  async getCommentById_pg(dto: GetCommentInputDto): Promise<CommentViewDtoPg> {
    const { commentId, userId } = dto;

    const comment =
      await this.commentsRepository.getByIdOrNotFoundFail_pg(commentId);

    const likesCount = await this._getLikesCount_pg(commentId);
    const dislikesCount = await this._getDislikesCount_pg(commentId);
    const userLikeStatus = await this._getUserLikeStatus_pg({
      commentId,
      userId,
    });

    return CommentViewDtoPg.mapToView({
      comment,
      likesCount,
      dislikesCount,
      myStatus: userLikeStatus,
    });
  }


  async getCommentsLikeInfo_pg(dto: {
    comments: CommentViewDtoPg[];
    userId: string | null;
  }): Promise<CommentViewDtoPg[]> {
    const { comments, userId } = dto;

    const updatedComments: CommentViewDtoPg[] = [];

    for (let i = 0; i < comments.length; i++) {
      const likesCount = await this._getLikesCount_pg(comments[i].id);
      const dislikesCount = await this._getDislikesCount_pg(comments[i].id);
      const userLikeStatus = await this._getUserLikeStatus_pg({
        commentId: comments[i].id,
        userId,
      });

      updatedComments.push({
        ...comments[i],
        likesInfo: {
          likesCount,
          dislikesCount,
          myStatus: userLikeStatus,
        },
      });
    }

    return updatedComments;
  }

  async _getLikesCount_pg(commentId: string): Promise<number> {
    const response =
      await this.commentsRepository.getCommentLikesStatusCount_pg({
        commentId,
        likeStatus: LikeStatusEnum.Like,
      });

    return response ?? 0;
  }

  async _getDislikesCount_pg(commentId: string): Promise<number> {
    const response =
      await this.commentsRepository.getCommentLikesStatusCount_pg({
        commentId,
        likeStatus: LikeStatusEnum.Dislike,
      });

    return response ?? 0;
  }

  async _getUserLikeStatus_pg(dto: {
    commentId: string;
    userId: string | null;
  }): Promise<LikeStatusEnum> {
    const { userId, commentId } = dto;

    let userLikeStatus = LikeStatusEnum.None;

    if (userId) {
      userLikeStatus =
        await this.commentsRepository.getUserCommentLikeStatus_pg({
          commentId,
          userId,
        });
    }

    return userLikeStatus ?? LikeStatusEnum.None;
  }

  // async getCommentById(dto: GetCommentInputDto): Promise<CommentViewDto> {
  //   const { commentId, userId } = dto;
  //
  //   const comment =
  //     await this.commentsRepository.getByIdOrNotFoundFail(commentId);
  //
  //   if (userId) {
  //     const userLikeStatus =
  //       await this.likesRepository.getLikeByUserIdAndEntityId({
  //         userId,
  //         entityId: commentId,
  //       });
  //
  //     comment.likesInfo.myStatus =
  //       userLikeStatus?.status ?? LikeStatusEnum.None;
  //   }
  //
  //   return CommentViewDto.mapToView(comment);
  // }

  async createComment_pg(dto: CreateCommentDto): Promise<string> {
    const user =
      await this.usersExternalQueryRepository.getByIdOrNotFoundFail_pg(
        dto.userId,
      );

    const comment = this.commentEntity.createInstance({
      content: dto.content,
      postId: dto.postId,
      userId: user.id,
    });

    await this.commentsRepository.createComment_pg(comment);

    return comment.id;
  }

  async updateComment_pg({
    userId,
    commentId,
    dto,
  }: {
    userId: string;
    commentId: string;
    dto: UpdateCommentInputDto;
  }): Promise<void> {
    const comment =
      await this.commentsRepository.getByIdOrNotFoundFail_pg(commentId);

    if (comment.userId !== userId) {
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

    await this.commentsRepository.updateComment_pg({
      commentId,
      content: dto.content,
    });
  }

  async deleteComment_pg({
    userId,
    commentId,
  }: {
    userId: string;
    commentId: string;
  }): Promise<void> {
    const comment =
      await this.commentsRepository.getByIdOrNotFoundFail_pg(commentId);

    if (comment.userId !== userId) {
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

    const deletedAt = new Date(Date.now()).toISOString();
    await this.commentsRepository.deleteComment_pg({ commentId, deletedAt });
  }

  async updateCommentLikeStatus_pg(dto: {
    userId: string;
    commentId: string;
    newLikeStatus: LikeStatusEnum;
  }): Promise<void> {
    const { userId, commentId, newLikeStatus } = dto;

    await this.commentsRepository.getByIdOrNotFoundFail_pg(commentId);

    const commentLike = await this.commentsRepository.findCommentLike_pg({
      commentId,
      userId,
    });

    if (!commentLike?.id) {
      switch (newLikeStatus) {
        case LikeStatusEnum.None:
          break;
        case LikeStatusEnum.Like:
        case LikeStatusEnum.Dislike:
          await this.commentsRepository.createCommentLike_pg({
            commentId,
            userId,
            likeStatus: mapEnumLikeStatusToBdStatus(newLikeStatus),
            updatedAt: new Date(Date.now()).toISOString(),
          });
          break;
      }
    } else {
      switch (newLikeStatus) {
        case LikeStatusEnum.None:
          await this.commentsRepository.deleteCommentLike_pg(commentLike.id);
          break;
        case LikeStatusEnum.Like:
        case LikeStatusEnum.Dislike:
          await this.commentsRepository.updateCommentLike_pg({
            commentLikeId: commentLike?.id,
            newLikeStatus: mapEnumLikeStatusToBdStatus(newLikeStatus),
            updatedAt: new Date(Date.now()).toISOString(),
          });
          break;
      }
    }
  }
  //
  // async updateCommentLikeStatus(dto: {
  //   userId: string;
  //   commentId: string;
  //   newLikeStatus: LikeStatusEnum;
  // }): Promise<void> {
  //   const { userId, commentId, newLikeStatus } = dto;
  //
  //   const comment =
  //     await this.commentsRepository.getByIdOrNotFoundFail(commentId);
  //
  //   const newLikesAndDislikesCounts = await this.likesService.updateLike({
  //     userId,
  //     newLikeStatus,
  //     entityId: commentId,
  //     currentLikesCount: comment.likesInfo?.likesCount || 0,
  //     currentDislikesCount: comment.likesInfo?.dislikesCount || 0,
  //   });
  //
  //   comment.updateLikes({
  //     likesCount: newLikesAndDislikesCounts.newLikesCount,
  //     dislikesCount: newLikesAndDislikesCounts.newDislikesCount,
  //   });
  //
  //   await this.commentsRepository.save(comment);
  // }
  //
  // async getLikeStatusesForComments(
  //   dto: GetCommentsLikesStatusesDto,
  // ): Promise<CommentViewDto[]> {
  //   const { comments, userId } = dto;
  //
  //   const userLikeStatuses = await this.likesRepository.getLikesForEntities({
  //     userId: userId!,
  //     entitiesIds: comments.map((comment) => comment.id),
  //   });
  //
  //   return comments.map((comment) => {
  //     const userLikeStatus =
  //       userLikeStatuses.find(
  //         (status) =>
  //           status.userId === userId && status.entityId === comment.id,
  //       )?.status || LikeStatusEnum.None;
  //
  //     return {
  //       ...comment,
  //       likesInfo: {
  //         ...comment.likesInfo,
  //         myStatus: userLikeStatus,
  //       },
  //     };
  //   });
  // }
}
