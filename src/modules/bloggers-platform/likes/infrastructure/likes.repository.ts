import { ObjectId } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { LikeStatusEnum } from "../enums/likes.enum";
import { NewestLikes } from "../../posts/domain/newestLikes.schema";
import { Like, LikeDocument, LikeModelType } from "../domain/like.entity";

@Injectable()
export class LikesRepository {
  constructor(@InjectModel(Like.name) private LikeModel: LikeModelType) {}

  async save(like: LikeDocument) {
    await like.save();
  }

  async getLikeByUserIdAndEntityId({
    userId,
    entityId,
  }: {
    userId: string;
    entityId: string;
  }): Promise<LikeDocument | null> {
    return this.LikeModel.findOne({
      userId,
      entityId,
    });
  }

  async deleteLike(likeId: ObjectId): Promise<void> {
    await this.LikeModel.deleteOne({ _id: likeId });
  }

  async getLastThreeLikesForEntity(entityId: string): Promise<NewestLikes[]> {
    const likes = await this.LikeModel.find({
      entityId,
      status: LikeStatusEnum.Like,
    })
      .sort({ createdAt: "desc" })
      .limit(3)
      .lean();

    return this._mapLastThreeLikes(likes);
  }

  async getLikesForEntities({
    userId,
    entitiesIds,
  }: {
    userId: string;
    entitiesIds: string[];
  }): Promise<LikeDocument[]> {
    return this.LikeModel.find({
      userId,
      entityId: { $in: entitiesIds },
    });
  }

  _mapLastThreeLikes(likes: LikeDocument[]): NewestLikes[] {
    if (!likes) {
      return [];
    }

    return likes.map((like) => ({
      addedAt: like.createdAt,
      userId: like.userId,
      login: like.userLogin,
    }));
  }
}
