import { Connection } from "mongoose";
import { DataSource } from "typeorm";
import { InjectDataSource } from "@nestjs/typeorm";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
} from "@nestjs/common";

import {
  RateLimit,
  RateLimitModelType,
} from "../rateLimit/domain/rateLimit.entity";
import { SETTINGS } from "../../settings";
import { DomainException } from "../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../core/exceptions/domain-exception-codes";

@Controller(SETTINGS.PATH.TESTING)
export class TestingController {
  constructor(
    @InjectConnection() private readonly databaseConnection: Connection,
    @InjectModel(RateLimit.name) private RateLimitModel: RateLimitModelType,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Delete("all-data")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    const promises = Object.keys(SETTINGS.TABLES).map((key) => {
      const query = `
       TRUNCATE TABLE ${SETTINGS.TABLES[key]} RESTART IDENTITY CASCADE;
    `;

      return this.dataSource.query(query);
    });

    try {
      await Promise.all(promises);

      return {
        status: "succeeded",
      };
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to truncate tables",
        extensions: [
          {
            field: "",
            message: "Failed to truncate tables",
          },
        ],
      });
    }
  }

  @Get("registration-code/:email")
  async getRegistrationCodeByEmail(@Param("email") email: string) {
    const userQuery = `
       SELECT * FROM ${SETTINGS.TABLES.USERS} WHERE "email" = $1
    `;

    try {
      const userResponse = await this.dataSource.query(userQuery, [email]);
      const user = userResponse[0];

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

      const codeQuery = `
       SELECT * FROM ${SETTINGS.TABLES.USERS_REGISTRATION_INFO} WHERE "userId" = $1
    `;

      const codeResponse = await this.dataSource.query(codeQuery, [user.id]);
      return { code: codeResponse[0].confirmationCode };
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get user registration confirmation code",
        extensions: [
          {
            field: "",
            message: "Failed to get user registration confirmation code",
          },
        ],
      });
    }
  }
  //
  // @Delete("rate-limits")
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async deleteRateLimit() {
  //   await this.RateLimitModel.deleteMany({});
  //
  //   return {
  //     status: "succeeded",
  //   };
  // }
}
