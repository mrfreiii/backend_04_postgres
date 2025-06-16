import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { validate as isValidUUID } from "uuid";
import { InjectDataSource } from "@nestjs/typeorm";

import { SETTINGS } from "../../../../../settings";
import { PostEntityType } from "../../domain/post.entity.pg";
import { PostViewDtoPg } from "../../api/view-dto/posts.view-dto.pg";
import { PaginatedViewDto } from "../../../../../core/dto/base.paginated.view-dto";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { GetPostsQueryParams } from "../../api/input-dto/get-posts-query-params.input-dto";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getByIdOrNotFoundFail_pg(postId: string): Promise<PostViewDtoPg> {
    if (!isValidUUID(postId)) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Post not found",
        extensions: [
          {
            field: "",
            message: "Post not found",
          },
        ],
      });
    }

    let post: PostEntityType;

    const query = `
       SELECT p.*, b."name" as "blogName"
       FROM ${SETTINGS.TABLES.POSTS} p 
         LEFT JOIN ${SETTINGS.TABLES.BLOGS} b
         ON p."blogId" = b."id"
           WHERE p."id" = $1 AND p."deletedAt" IS NULL
    `;

    try {
      const result = await this.dataSource.query(query, [postId]);
      post = result?.[0];
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get post from db",
        extensions: [
          {
            field: "",
            message: "Failed to get post from db",
          },
        ],
      });
    }

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Post not found",
        extensions: [
          {
            field: "",
            message: "Post not found",
          },
        ],
      });
    }
    return PostViewDtoPg.mapToView({ post });
  }

  async getAll_pg({
    requestParams,
    blogId,
  }: {
    requestParams: GetPostsQueryParams;
    blogId?: string;
  }): Promise<PaginatedViewDto<PostViewDtoPg[]>> {
    const queryParams: string[] = [];

    let dataQuery = `
       SELECT p.*, b."name" as "blogName" 
       FROM ${SETTINGS.TABLES.POSTS} p
         LEFT JOIN ${SETTINGS.TABLES.BLOGS} b
         ON p."blogId" = b."id"
           WHERE p."deletedAt" IS NULL
    `;
    let countQuery = `
       SELECT count(*)
       FROM ${SETTINGS.TABLES.POSTS} p
         LEFT JOIN ${SETTINGS.TABLES.BLOGS} b
         ON p."blogId" = b."id"
           WHERE p."deletedAt" IS NULL
    `;

    if (blogId) {
      const additionalPart = ` AND p."blogId" = $1`;

      dataQuery = `${dataQuery} ${additionalPart}`;
      countQuery = `${countQuery} ${additionalPart}`;

      queryParams.push(blogId);
    }

    dataQuery = `
       ${dataQuery}
         ORDER BY "${requestParams.sortBy}" ${requestParams.sortDirection}
         LIMIT ${requestParams.pageSize}
         OFFSET ${requestParams.calculateSkip()}
    `;

    try {
      const posts = await this.dataSource.query(dataQuery, [...queryParams]);

      const totalCountRes = await this.dataSource.query(countQuery, [
        ...queryParams,
      ]);

      const items = posts.map((p) => PostViewDtoPg.mapToView({ post: p }));

      return PaginatedViewDto.mapToView({
        items,
        totalCount: Number(totalCountRes?.[0]?.count),
        page: requestParams.pageNumber,
        size: requestParams.pageSize,
      });
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get posts from db",
        extensions: [
          {
            field: "",
            message: "Failed to get posts from db",
          },
        ],
      });
    }
  }
}
