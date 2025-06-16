import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";

import { SETTINGS } from "../../../../../settings";
import { UserViewDtoPg } from "../../api/view-dto/users.view-dto.pg";
import { PaginatedViewDto } from "../../../../../core/dto/base.paginated.view-dto";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { GetUsersQueryParams } from "../../api/input-dto/get-users-query-params.input-dto";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getByIdOrNotFoundFail_pg(id: string): Promise<UserViewDtoPg> {
    const query = `
       SELECT * FROM ${SETTINGS.TABLES.USERS} WHERE "id" = $1 AND "deletedAt" IS NULL;
    `;

    try {
      const result = await this.dataSource.query(query, [id]);

      if (!result.length) {
        throw new Error();
      }

      return UserViewDtoPg.mapToView(result?.[0]);
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "User not found",
        extensions: [
          {
            field: "",
            message: "User not found",
          },
        ],
      });
    }
  }

  async getAll_pg(
    requestParams: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDtoPg[]>> {
    const queryParams: string[] = [];

    let dataQuery = `
       SELECT * FROM ${SETTINGS.TABLES.USERS} WHERE "deletedAt" IS NULL
    `;
    let countQuery = `
       SELECT count(*) FROM ${SETTINGS.TABLES.USERS} WHERE "deletedAt" IS NULL
    `;

    if (requestParams.searchLoginTerm) {
      const loginPart = `AND "login" ilike $${queryParams.length + 1}`;

      dataQuery = `${dataQuery} ${loginPart}`;
      countQuery = `${countQuery} ${loginPart}`;

      queryParams.push(`%${requestParams.searchLoginTerm}%`);
    }

    if (requestParams.searchEmailTerm) {
      const operator = requestParams.searchLoginTerm ? "OR" : "AND";
      const emailPart = `${operator} "email" ilike $${queryParams.length + 1}`;

      dataQuery = `${dataQuery} ${emailPart}`;
      countQuery = `${countQuery} ${emailPart}`;

      queryParams.push(`%${requestParams.searchEmailTerm}%`);
    }

    dataQuery = `${dataQuery} ORDER BY "${requestParams.sortBy}" ${requestParams.sortDirection} LIMIT ${requestParams.pageSize} OFFSET ${requestParams.calculateSkip()}`;

    const users = await this.dataSource.query(dataQuery, [...queryParams]);

    const totalCountRes = await this.dataSource.query(countQuery, [
      ...queryParams,
    ]);

    const items = users.map(UserViewDtoPg.mapToView);

    return PaginatedViewDto.mapToView({
      items,
      totalCount: Number(totalCountRes?.[0]?.count),
      page: requestParams.pageNumber,
      size: requestParams.pageSize,
    });
  }
}
