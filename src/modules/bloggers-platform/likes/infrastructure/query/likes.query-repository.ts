import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { Like, LikeModelType } from "../../domain/like.entity";
import { LikeViewDto } from "../../api/view-dto/likes.view-dto";

@Injectable()
export class LikesQueryRepository {
  constructor(@InjectModel(Like.name) private LikeModel: LikeModelType) {}

  async getLikeByUserIdAndEntityId({
    userId,
    entityId,
  }: {
    userId: string;
    entityId: string;
  }): Promise<LikeViewDto | null> {
    const likeStatus = await this.LikeModel.findOne({
      userId,
      entityId,
    });

    if (!likeStatus) {
      return null;
    }

    return LikeViewDto.mapToView(likeStatus);
  }
}
