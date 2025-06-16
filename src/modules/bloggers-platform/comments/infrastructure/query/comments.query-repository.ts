import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";

import { SETTINGS } from "../../../../../settings";
import { CommentViewDtoPg } from "../../api/view-dto/comments.view-dto.pg";
import { PaginatedViewDto } from "../../../../../core/dto/base.paginated.view-dto";
import { GetCommentsQueryParams } from "../../api/input-dto/get-comments-query-params.input-dto";

@Injectable()
export class CommentsQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

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

    const items = comments.map((c) =>
      CommentViewDtoPg.mapToView({ comment: c }),
    );

    return PaginatedViewDto.mapToView({
      items,
      totalCount: Number(totalCountRes?.[0]?.count),
      page: requestParams.pageNumber,
      size: requestParams.pageSize,
    });
  }
}
