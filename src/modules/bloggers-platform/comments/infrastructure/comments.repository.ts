import mongoose from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { Comment, CommentDocument, CommentModelType } from "../domain/comment.entity";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";
import { PostEntityType } from "../../posts/domain/post.entity.pg";
import { SETTINGS } from "../../../../settings";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { CommentEntityType } from "../domain/comment.entity.pg";

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

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

  async save(comment: CommentDocument) {
    await comment.save();
  }

  async getByIdOrNotFoundFail(id: string): Promise<CommentDocument> {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isObjectId) {
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

    const comment = await this.CommentModel.findOne({
      _id: id,
      deletedAt: null,
    });

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
}
