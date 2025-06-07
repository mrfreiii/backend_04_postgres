import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { LikeStatusEnum } from "../enums/likes.enum";
import { Like, LikeModelType } from "../domain/like.entity";
import { LikesRepository } from "../infrastructure/likes.repository";
import { UpdateLikeInputDto } from "./input-dto/update-like.input-dto";
import { UsersExternalQueryRepository } from "../../../user-accounts/users/infrastructure/external-query/users.external-query-repository";

@Injectable()
export class LikesService {
  constructor(
    @InjectModel(Like.name) private LikeModel: LikeModelType,
    private likesRepository: LikesRepository,
    private usersExternalQueryRepository: UsersExternalQueryRepository,
  ) {}

  async updateLike(
    dto: UpdateLikeInputDto,
  ): Promise<{ newLikesCount: number; newDislikesCount: number }> {
    const {
      userId,
      entityId,
      newLikeStatus,
      currentLikesCount,
      currentDislikesCount,
    } = dto;
    const currentLike = await this.likesRepository.getLikeByUserIdAndEntityId({
      userId,
      entityId,
    });
    const currentLikeStatus = currentLike?.status;

    const user =
      await this.usersExternalQueryRepository.getByIdOrNotFoundFail(userId);

    if (!currentLike && newLikeStatus !== LikeStatusEnum.None) {
      const like = this.LikeModel.createInstance({
        status: newLikeStatus,
        entityId,
        userId,
        userLogin: user?.login || "unknown",
      });

      await this.likesRepository.save(like);
    }

    if (
      currentLike &&
      currentLikeStatus !== newLikeStatus &&
      newLikeStatus !== LikeStatusEnum.None
    ) {
      currentLike.updateLikeStatus(newLikeStatus);

      await this.likesRepository.save(currentLike);
    }

    if (currentLike && newLikeStatus === LikeStatusEnum.None) {
      await this.likesRepository.deleteLike(currentLike.id);
    }

    let newLikesCount = currentLikesCount;
    let newDislikesCount = currentDislikesCount;

    switch (newLikeStatus) {
      case LikeStatusEnum.None:
        if (!currentLike) break;

        if (currentLikeStatus === LikeStatusEnum.Like) {
          newLikesCount -= 1;
        }

        if (currentLikeStatus === LikeStatusEnum.Dislike) {
          newDislikesCount -= 1;
        }

        break;
      case LikeStatusEnum.Like:
        if (currentLikeStatus !== LikeStatusEnum.Like) {
          newLikesCount += 1;
        }
        if (currentLikeStatus === LikeStatusEnum.Dislike) {
          newDislikesCount -= 1;
        }
        break;

      case LikeStatusEnum.Dislike:
        if (currentLikeStatus !== LikeStatusEnum.Dislike) {
          newDislikesCount += 1;
        }
        if (currentLikeStatus === LikeStatusEnum.Like) {
          newLikesCount -= 1;
        }
        break;
    }

    return {
      newLikesCount,
      newDislikesCount,
    };
  }
}
