import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { validate as isValidUUID } from "uuid";
import { InjectDataSource } from "@nestjs/typeorm";

import { SETTINGS } from "../../../../settings";
import { CommentEntityType } from "../domain/comment.entity.pg";
import { LikeStatusEnum } from "../../enums/likes.enum";
import { CommentQuerySelectType } from "./types/commentQueryType";
import { CommentLikeEntity } from "../domain/commentLike.entity.pg";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class CommentsRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createComment_pg(comment: CommentEntityType): Promise<void> {
    const query = `
        INSERT INTO ${SETTINGS.TABLES.COMMENTS}
            ("id","content","postId","userId","createdAt")
            VALUES
            ($1, $2, $3, $4, $5)
    `;

    try {
      await this.dataSource.query(query, [
        comment.id,
        comment.content,
        comment.postId,
        comment.userId,
        comment.createdAt,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to create comment in db",
        extensions: [
          {
            field: "",
            message: "Failed to create comment in db",
          },
        ],
      });
    }
  }

  async getByIdOrNotFoundFail_pg(
    commentId: string,
  ): Promise<CommentQuerySelectType> {
    if (!isValidUUID(commentId)) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Comment not found",
        extensions: [
          {
            field: "",
            message: "Comment not found",
          },
        ],
      });
    }

    let comment: CommentQuerySelectType;

    const query = `
       SELECT c.*, u."login" as "userLogin"
       FROM ${SETTINGS.TABLES.COMMENTS} c
         LEFT JOIN ${SETTINGS.TABLES.USERS} u
         ON c."userId" = u."id"
           WHERE c."id" = $1 AND c."deletedAt" IS NULL
    `;

    try {
      const result = await this.dataSource.query(query, [commentId]);
      comment = result?.[0];
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get comment from db",
        extensions: [
          {
            field: "",
            message: "Failed to get comment from db",
          },
        ],
      });
    }

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Comment not found",
        extensions: [
          {
            field: "",
            message: "Comment not found",
          },
        ],
      });
    }
    return comment;
  }

  async getCommentLikesStatusCount_pg(dto: {
    commentId: string;
    likeStatus: LikeStatusEnum;
  }): Promise<number> {
    const query = `
       SELECT count(cl.*) 
       FROM ${SETTINGS.TABLES.COMMENTS_LIKES} cl
       LEFT JOIN ${SETTINGS.TABLES.LIKES_STATUSES} ls
       ON cl."likeStatus" = ls."id"
       WHERE cl."commentId" = $1
       AND ls."status" = $2
    `;

    try {
      const result = await this.dataSource.query(query, [
        dto.commentId,
        dto.likeStatus,
      ]);
      return Number(result?.[0]?.count);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get comment likes status count from db",
        extensions: [
          {
            field: "",
            message: "Failed to get comment likes status count from db",
          },
        ],
      });
    }
  }

  async getUserCommentLikeStatus_pg(dto: {
    commentId: string;
    userId: string;
  }): Promise<LikeStatusEnum> {
    const query = `
       SELECT ls."status"
       FROM ${SETTINGS.TABLES.COMMENTS_LIKES} cl
       LEFT JOIN ${SETTINGS.TABLES.LIKES_STATUSES} ls
         ON cl."likeStatus" = ls."id"
           LEFT JOIN ${SETTINGS.TABLES.USERS} u
           ON cl."userId" = u."id"
             WHERE cl."commentId" = $1
             AND cl."userId" = $2
    `;

    try {
      const response = await this.dataSource.query(query, [
        dto.commentId,
        dto.userId,
      ]);
      return response?.[0]?.status;
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get user comment like status from db",
        extensions: [
          {
            field: "",
            message: "Failed to get user comment like status from db",
          },
        ],
      });
    }
  }

  async updateComment_pg(dto: {
    commentId: string;
    content: string;
  }): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.COMMENTS}
         SET "content" = $1
         WHERE "id" = $2
    `;

    try {
      await this.dataSource.query(query, [dto.content, dto.commentId]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to update comment",
        extensions: [
          {
            field: "",
            message: "Failed to update comment",
          },
        ],
      });
    }
  }

  async deleteComment_pg(dto: {
    commentId: string;
    deletedAt: string;
  }): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.COMMENTS}
        SET "deletedAt" = $1
        WHERE "id" = $2
    `;

    try {
      await this.dataSource.query(query, [dto.deletedAt, dto.commentId]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to delete comment",
        extensions: [
          {
            field: "",
            message: "Failed to delete comment",
          },
        ],
      });
    }
  }

  async findCommentLike_pg(dto: {
    commentId: string;
    userId: string;
  }): Promise<CommentLikeEntity> {
    const query = `
       SELECT * FROM ${SETTINGS.TABLES.COMMENTS_LIKES}
       WHERE "commentId" = $1
       AND "userId" = $2
    `;

    try {
      const result = await this.dataSource.query(query, [
        dto.commentId,
        dto.userId,
      ]);
      return result?.[0];
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get comment like from db",
        extensions: [
          {
            field: "",
            message: "Failed to get comment like from db",
          },
        ],
      });
    }
  }

  async createCommentLike_pg(commentLike: CommentLikeEntity): Promise<void> {
    const query = `
        INSERT INTO ${SETTINGS.TABLES.COMMENTS_LIKES}
            ("commentId","userId","likeStatus","updatedAt")
            VALUES
            ($1, $2, $3, $4)
    `;

    try {
      await this.dataSource.query(query, [
        commentLike.commentId,
        commentLike.userId,
        commentLike.likeStatus,
        commentLike.updatedAt,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to create comment like in db",
        extensions: [
          {
            field: "",
            message: "Failed to create comment like in db",
          },
        ],
      });
    }
  }

  async deleteCommentLike_pg(commentLikeId: number): Promise<void> {
    const query = `
        DELETE FROM ${SETTINGS.TABLES.COMMENTS_LIKES}
        WHERE "id" = $1
    `;

    try {
      await this.dataSource.query(query, [commentLikeId]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to delete comment like in db",
        extensions: [
          {
            field: "",
            message: "Failed to delete comment like in db",
          },
        ],
      });
    }
  }

  async updateCommentLike_pg(dto: {
    commentLikeId: number;
    newLikeStatus: number;
    updatedAt: string;
  }): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.COMMENTS_LIKES}
        SET "likeStatus" = $1,
            "updatedAt" = $2
        WHERE "id" = $3
    `;

    try {
      await this.dataSource.query(query, [
        dto.newLikeStatus,
        dto.updatedAt,
        dto.commentLikeId,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to update comment like in db",
        extensions: [
          {
            field: "",
            message: "Failed to update comment like in db",
          },
        ],
      });
    }
  }
}
