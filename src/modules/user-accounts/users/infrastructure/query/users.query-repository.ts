import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectDataSource } from "@nestjs/typeorm";

import { User, UserModelType } from "../../domain/user.entity";
import { UserViewDto } from "../../api/view-dto/users.view-dto";
import { UserViewDtoPg } from "../../api/view-dto/users.view-dto.pg";
import { PaginatedViewDto } from "../../../../../core/dto/base.paginated.view-dto";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { GetUsersQueryParams } from "../../api/input-dto/get-users-query-params.input-dto";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";
import { SETTINGS } from "../../../../../settings";

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

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
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
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

  // async getByIdOrNotFoundFail(id: string): Promise<UserViewDto> {
  //   const user = await this.UserModel.findOne({
  //     _id: id,
  //     deletedAt: null,
  //   });
  //
  //   if (!user) {
  //     throw new DomainException({
  //       code: DomainExceptionCode.NotFound,
  //       message: "User not found",
  //       extensions: [
  //         {
  //           field: "",
  //           message: "User not found",
  //         },
  //       ],
  //     });
  //   }
  //
  //   return UserViewDto.mapToView(user);
  // }

  // async getAll(
  //   query: GetUsersQueryParams,
  // ): Promise<PaginatedViewDto<UserViewDto[]>> {
  //   const filter: FilterQuery<User> = {
  //     deletedAt: null,
  //   };
  //
  //   if (query.searchLoginTerm) {
  //     filter.$or = filter.$or || [];
  //     filter.$or.push({
  //       login: { $regex: query.searchLoginTerm, $options: "i" },
  //     });
  //   }
  //
  //   if (query.searchEmailTerm) {
  //     filter.$or = filter.$or || [];
  //     filter.$or.push({
  //       email: { $regex: query.searchEmailTerm, $options: "i" },
  //     });
  //   }
  //
  //   const users = await this.UserModel.find(filter)
  //     .sort({ [query.sortBy]: query.sortDirection })
  //     .skip(query.calculateSkip())
  //     .limit(query.pageSize);
  //
  //   const totalCount = await this.UserModel.countDocuments(filter);
  //
  //   const items = users.map(UserViewDto.mapToView);
  //
  //   return PaginatedViewDto.mapToView({
  //     items,
  //     totalCount,
  //     page: query.pageNumber,
  //     size: query.pageSize,
  //   });
  // }
}
