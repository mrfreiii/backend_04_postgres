import { ObjectId } from "mongoose";
import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectDataSource } from "@nestjs/typeorm";

import { LikeStatusEnum } from "../enums/likes.enum";
import { NewestLikes } from "../../posts/domain/newestLikes.schema";
import { Like, LikeDocument, LikeModelType } from "../domain/like.entity";
import { SETTINGS } from "../../../../settings";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class LikesRepository {
  constructor(
    @InjectModel(Like.name) private LikeModel: LikeModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getPostLikesStatusCount_pg(dto: {
    postId: string;
    likeStatus: LikeStatusEnum;
  }): Promise<number> {
    const query = `
       SELECT count(pl.*) 
       FROM ${SETTINGS.TABLES.POSTS_LIKES} pl
       LEFT JOIN ${SETTINGS.TABLES.LIKES_STATUSES} ls
       ON pl."likeStatus" = ls."id"
       WHERE pl."postId" = $1
       AND ls."status" = $2
    `;

    try {
      const result = await this.dataSource.query(query, [
        dto.postId,
        dto.likeStatus,
      ]);
      return Number(result?.[0]?.count);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get post likes status count from db",
        extensions: [
          {
            field: "",
            message: "Failed to get post likes status count from db",
          },
        ],
      });
    }
  }

  async getPostLastThreeLikes_pg(postId: string): Promise<NewestLikes[]> {
    const query = `
       SELECT pl."updatedAt" as "addedAt",
              pl."userId",
              u."login"
       FROM ${SETTINGS.TABLES.POSTS_LIKES} pl
       LEFT JOIN ${SETTINGS.TABLES.LIKES_STATUSES} ls
         ON pl."likeStatus" = ls."id"
           LEFT JOIN ${SETTINGS.TABLES.USERS} u
           ON pl."userId" = u."id"
             WHERE pl."postId" = $1
             AND ls."status" = $2
               ORDER BY pl."updatedAt" desc
               LIMIT 3
               OFFSET 0
    `;

    try {
      return this.dataSource.query(query, [
        postId,
        LikeStatusEnum.Like,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get post last three likes from db",
        extensions: [
          {
            field: "",
            message: "Failed to get post last three likes from db",
          },
        ],
      });
    }
  }

  async getUserPostLikeStatus_pg(dto: {
    postId: string;
    userId: string;
  }): Promise<LikeStatusEnum> {
    const query = `
       SELECT ls."status"
       FROM ${SETTINGS.TABLES.POSTS_LIKES} pl
       LEFT JOIN ${SETTINGS.TABLES.LIKES_STATUSES} ls
         ON pl."likeStatus" = ls."id"
           LEFT JOIN ${SETTINGS.TABLES.USERS} u
           ON pl."userId" = u."id"
             WHERE pl."postId" = $1
             AND pl."userId" = $2
    `;

    try {
      const response = await this.dataSource.query(query, [dto.postId, dto.userId]);
      return response?.[0]?.status;
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get user post like status from db",
        extensions: [
          {
            field: "",
            message: "Failed to get user post like status from db",
          },
        ],
      });
    }
  }

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
