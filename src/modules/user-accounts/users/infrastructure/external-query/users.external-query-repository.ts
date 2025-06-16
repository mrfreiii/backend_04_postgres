import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";

import { SETTINGS } from "../../../../../settings";
import { UserViewDtoPg } from "../../api/view-dto/users.view-dto.pg";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class UsersExternalQueryRepository {
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
}
