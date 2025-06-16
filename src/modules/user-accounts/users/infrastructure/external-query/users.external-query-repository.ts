import { InjectModel } from "@nestjs/mongoose";
import { Injectable } from "@nestjs/common";

import { User, UserModelType } from "../../domain/user.entity";
import { UserExternalDto } from "./external-dto/users.external-dto";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";
import { UserViewDtoPg } from "../../api/view-dto/users.view-dto.pg";
import { SETTINGS } from "../../../../../settings";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class UsersExternalQueryRepository {
  constructor(
    @InjectModel(User.name) private UserModel: UserModelType,
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

  async getByIdOrNotFoundFail(id: string): Promise<UserExternalDto> {
    const user = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "User not found",
        extensions: [
          {
            field: "",
            message: "User not found",
          },
        ],
      });
    }

    return UserExternalDto.mapToView(user);
  }
}
