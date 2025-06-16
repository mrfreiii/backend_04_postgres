import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { validate as isValidUUID } from "uuid";
import { InjectDataSource } from "@nestjs/typeorm";

import { SETTINGS } from "../../../../../settings";
import { BlogEntityType } from "../../domain/blog.entity.pg";
import { BlogViewDtoPg } from "../../api/view-dto/blogs.view-dto.pg";
import { PaginatedViewDto } from "../../../../../core/dto/base.paginated.view-dto";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { GetBlogsQueryParams } from "../../api/input-dto/get-blogs-query-params.input-dto";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getByIdOrNotFoundFail_pg(blogId: string): Promise<BlogViewDtoPg> {
    if (!isValidUUID(blogId)) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Blog not found",
        extensions: [
          {
            field: "",
            message: "Blog not found",
          },
        ],
      });
    }

    let blog: BlogEntityType;

    const query = `
       SELECT * FROM ${SETTINGS.TABLES.BLOGS} WHERE "id" = $1 AND "deletedAt" IS NULL
    `;

    try {
      const result = await this.dataSource.query(query, [blogId]);
      blog = result?.[0];
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get blog from db",
        extensions: [
          {
            field: "",
            message: "Failed to get blog from db",
          },
        ],
      });
    }

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "Blog not found",
        extensions: [
          {
            field: "",
            message: "Blog not found",
          },
        ],
      });
    }
    return BlogViewDtoPg.mapToView(blog);
  }

  async getAll_pg(
    requestParams: GetBlogsQueryParams,
  ): Promise<PaginatedViewDto<BlogViewDtoPg[]>> {
    const queryParams: string[] = [];

    let dataQuery = `
       SELECT * FROM ${SETTINGS.TABLES.BLOGS} WHERE "deletedAt" IS NULL
    `;
    let countQuery = `
       SELECT count(*) FROM ${SETTINGS.TABLES.BLOGS} WHERE "deletedAt" IS NULL
    `;

    if (requestParams.searchNameTerm) {
      const additionalPart = `AND "name" ilike $${queryParams.length + 1}`;

      dataQuery = `${dataQuery} ${additionalPart}`;
      countQuery = `${countQuery} ${additionalPart}`;

      queryParams.push(`%${requestParams.searchNameTerm}%`);
    }

    dataQuery = `${dataQuery} ORDER BY "${requestParams.sortBy}" ${requestParams.sortDirection} LIMIT ${requestParams.pageSize} OFFSET ${requestParams.calculateSkip()}`;

    const blogs = await this.dataSource.query(dataQuery, [...queryParams]);

    const totalCountRes = await this.dataSource.query(countQuery, [
      ...queryParams,
    ]);

    const items = blogs.map(BlogViewDtoPg.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount: Number(totalCountRes?.[0]?.count),
      page: requestParams.pageNumber,
      size: requestParams.pageSize,
    });
  }
}
