import mongoose, { FilterQuery } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { GetCommentsQueryParams } from "../../api/input-dto/get-comments-query-params.input-dto";
import { CommentViewDto } from "../../api/view-dto/comments.view-dto";
import { Comment, CommentModelType } from "../../domain/comment.entity";
import { PaginatedViewDto } from "../../../../../core/dto/base.paginated.view-dto";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";
import { PostViewDtoPg } from "../../../posts/api/view-dto/posts.view-dto.pg";
import { validate as isValidUUID } from "uuid";
import { PostEntityType } from "../../../posts/domain/post.entity.pg";
import { SETTINGS } from "../../../../../settings";
import { CommentViewDtoPg } from "../../api/view-dto/comments.view-dto.pg";
import { CommentEntityType } from "../../domain/comment.entity.pg";
import { CommentQuerySelectType } from "../types/commentQueryType";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { GetPostsQueryParams } from "../../../posts/api/input-dto/get-posts-query-params.input-dto";

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getByIdOrNotFoundFail_pg(commentId: string): Promise<CommentViewDtoPg> {
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
    return CommentViewDtoPg.mapToView(comment);
  }

  async getAll_pg({
    requestParams,
    postId,
  }: {
    requestParams: GetCommentsQueryParams;
    postId?: string;
  }): Promise<PaginatedViewDto<CommentViewDtoPg[]>> {
    const queryParams: string[] = [];

    let dataQuery = `
       SELECT c.*, u."login" as "userLogin"
       FROM ${SETTINGS.TABLES.COMMENTS} c
         LEFT JOIN ${SETTINGS.TABLES.USERS} u
         ON c."userId" = u."id"
           WHERE c."deletedAt" IS NULL
    `;

    let countQuery = `
       SELECT count(*)
       FROM ${SETTINGS.TABLES.COMMENTS} c
         WHERE c."deletedAt" IS NULL
    `;

    if (postId) {
      const additionalPart = ` AND c."postId" = $1`;

      dataQuery = `${dataQuery} ${additionalPart}`;
      countQuery = `${countQuery} ${additionalPart}`;

      queryParams.push(postId);
    }

    dataQuery = `
       ${dataQuery}
         ORDER BY "${requestParams.sortBy}" ${requestParams.sortDirection}
         LIMIT ${requestParams.pageSize}
         OFFSET ${requestParams.calculateSkip()}
    `;

    const comments = await this.dataSource.query(dataQuery, [...queryParams]);

    const totalCountRes = await this.dataSource.query(countQuery, [
      ...queryParams,
    ]);

    const items = comments.map(CommentViewDtoPg.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount: Number(totalCountRes?.[0]?.count),
      page: requestParams.pageNumber,
      size: requestParams.pageSize,
    });
  }

  async getAll({
    query,
    postId,
  }: {
    query: GetCommentsQueryParams;
    postId?: string;
  }): Promise<PaginatedViewDto<CommentViewDto[]>> {
    const filter: FilterQuery<Comment> = {
      deletedAt: null,
    };

    if (postId) {
      filter.$or = filter.$or || [];
      filter.$or.push({
        postId: { $regex: postId, $options: "i" },
      });
    }

    const comments = await this.CommentModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.CommentModel.countDocuments(filter);

    const items = comments.map(CommentViewDto.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }

  async getByIdOrNotFoundFail(id: string): Promise<CommentViewDto> {
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

    return CommentViewDto.mapToView(comment);
  }
}
